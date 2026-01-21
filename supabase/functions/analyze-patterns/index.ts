import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSafeErrorMessage, getCorsHeaders } from "../_shared/security.ts";

interface CheckIn {
  id: string;
  mood: string;
  journal: string | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  content: string;
  role: string;
  created_at: string;
}

interface MedicineDose {
  id: string;
  medicine_id: string;
  scheduled_at: string;
  status: string;
  medicine?: { name: string } | null;
}

interface SubmittedCase {
  id: string;
  status: string;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  category: string;
}

interface PatternAlert {
  alert_type: string;
  message: string;
  severity: string;
  suggested_action?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    console.log(`Analyzing patterns for user ${user.id}`);

    // Rate limiting check
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _action: 'analyze_patterns',
      _max_requests: 10,
      _window_minutes: 60
    });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    } else if (rateLimitCheck && !rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for pattern analysis: user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Pattern analysis rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up old alerts (older than 7 days)
    await supabase.rpc('cleanup_old_alerts');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // First, mark any pending doses older than 4 hours as missed
    const fourHoursAgo = new Date();
    fourHoursAgo.setTime(fourHoursAgo.getTime() - 4 * 60 * 60 * 1000);
    
    console.log(`Checking for pending doses before ${fourHoursAgo.toISOString()}`);
    
    // Get pending doses that should be marked as missed
    const { data: pendingDoses, error: pendingError } = await supabase
      .from("medicine_doses")
      .select("*, medicine:medicines(name)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lt("scheduled_at", fourHoursAgo.toISOString());
    
    if (pendingError) {
      console.error("Error fetching pending doses:", pendingError);
    } else if (pendingDoses && pendingDoses.length > 0) {
      console.log(`Found ${pendingDoses.length} doses to mark as missed`);
      
      // Mark each pending dose as missed
      for (const dose of pendingDoses) {
        const { error: updateError } = await supabase
          .from("medicine_doses")
          .update({ status: "missed" })
          .eq("id", dose.id);
        
        if (updateError) {
          console.error(`Error updating dose ${dose.id}:`, updateError);
        } else {
          console.log(`Marked dose ${dose.id} as missed`);
        }
      }
    }

    // Fetch all required data in parallel
    const [checkInsRes, messagesRes, existingAlertsRes, missedDosesRes, reviewedCasesRes] = await Promise.all([
      supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", fourteenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("role", "user")
        .gte("created_at", fourteenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("alerts")
        .select("alert_type, message, created_at")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString()),
      supabase
        .from("medicine_doses")
        .select("*, medicine:medicines(name)")
        .eq("user_id", user.id)
        .eq("status", "missed")
        .gte("scheduled_at", sevenDaysAgo.toISOString())
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("submitted_cases")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "reviewed")
        .gte("reviewed_at", sevenDaysAgo.toISOString())
        .order("reviewed_at", { ascending: false })
    ]);

    const checkIns = checkInsRes.data as CheckIn[] | null;
    const messages = messagesRes.data as ChatMessage[] | null;
    const existingAlerts = existingAlertsRes.data || [];
    const missedDoses = missedDosesRes.data as MedicineDose[] | null;
    const reviewedCases = reviewedCasesRes.data as SubmittedCase[] | null;

    const existingAlertKeys = new Set(
      existingAlerts.map(a => `${a.alert_type}:${a.message.substring(0, 50)}`)
    );

    const alerts: PatternAlert[] = [];

    // ============ CHECK-IN MOOD PATTERN DETECTION ============
    if (checkIns && checkIns.length >= 2) {
      const checkInsByDay = new Map<string, CheckIn[]>();
      checkIns.forEach(checkIn => {
        const day = checkIn.created_at.split('T')[0];
        if (!checkInsByDay.has(day)) {
          checkInsByDay.set(day, []);
        }
        checkInsByDay.get(day)!.push(checkIn);
      });

      const dailyMoods: { date: string; mood: string }[] = [];
      checkInsByDay.forEach((dayCheckIns, date) => {
        const latestMood = dayCheckIns[0].mood;
        dailyMoods.push({ date, mood: latestMood });
      });
      dailyMoods.sort((a, b) => b.date.localeCompare(a.date));

      // Pattern 1: Continuous low mood for 2+ days - suggest doctor consultation
      const lowMoods = ['sad', 'anxious', 'stressed', 'overwhelmed', 'depressed'];
      let consecutiveLowDays = 0;
      
      for (const { mood } of dailyMoods) {
        if (lowMoods.includes(mood.toLowerCase())) {
          consecutiveLowDays++;
        } else {
          break;
        }
      }

      if (consecutiveLowDays >= 2) {
        alerts.push({
          alert_type: "consult_doctor",
          message: `You've been feeling low for ${consecutiveLowDays} consecutive days. It might be helpful to speak with a healthcare professional who can provide personalized support and guidance.`,
          severity: consecutiveLowDays >= 4 ? "high" : "medium",
          suggested_action: "Consider booking a consultation with a mental health professional."
        });
      }

      // Pattern 2: Wellness score drop detection
      if (dailyMoods.length >= 5) {
        const moodScores: Record<string, number> = {
          happy: 100, calm: 80, neutral: 60, anxious: 40, sad: 30, stressed: 35, overwhelmed: 25, depressed: 20
        };
        
        const recentAvg = dailyMoods.slice(0, 3).reduce((sum, m) => sum + (moodScores[m.mood.toLowerCase()] || 50), 0) / 3;
        const olderAvg = dailyMoods.slice(3, 6).reduce((sum, m) => sum + (moodScores[m.mood.toLowerCase()] || 50), 0) / Math.min(3, dailyMoods.slice(3, 6).length);
        
        if (olderAvg - recentAvg >= 20) {
          alerts.push({
            alert_type: "wellness_score_drop",
            message: `Your wellness score has dropped significantly in the past few days. This is worth paying attention to. Take some time for self-care and consider reaching out for support if needed.`,
            severity: "medium",
            suggested_action: "Review your recent activities and try the recommended strategies on your dashboard."
          });
        }
      }

      // Pattern 3: Mood volatility
      if (dailyMoods.length >= 5) {
        let moodChanges = 0;
        for (let i = 1; i < Math.min(7, dailyMoods.length); i++) {
          if (dailyMoods[i].mood !== dailyMoods[i - 1].mood) {
            moodChanges++;
          }
        }
        if (moodChanges >= 5) {
          alerts.push({
            alert_type: "mood_variability",
            message: "Your moods have been fluctuating frequently. This can sometimes happen during stressful periods. Consistent routines and mindfulness practices may help stabilize your mood.",
            severity: "low",
            suggested_action: "Try establishing a calming morning and evening routine."
          });
        }
      }
    }

    // ============ MISSED MEDICINE ALERTS ============
    if (missedDoses && missedDoses.length > 0) {
      console.log(`Found ${missedDoses.length} missed doses for alert generation`);
      
      const today = new Date().toISOString().split('T')[0];
      const todayMissed = missedDoses.filter(d => d.scheduled_at.split('T')[0] === today);
      
      if (todayMissed.length > 0) {
        // Get unique medicine names for better messaging
        const medicineNames = [...new Set(todayMissed.map(d => d.medicine?.name).filter(Boolean))];
        const medicineList = medicineNames.length > 0 ? ` (${medicineNames.join(', ')})` : '';
        
        alerts.push({
          alert_type: "medicine_missed",
          message: `You missed ${todayMissed.length} medicine dose${todayMissed.length > 1 ? 's' : ''}${medicineList} today. Try to take them as soon as possible unless it's close to your next scheduled dose.`,
          severity: todayMissed.length >= 2 ? "high" : "medium",
          suggested_action: "Check your Medicine Tracker and take your medication if appropriate."
        });
      }

      // Check for pattern of missed doses (in the past week)
      if (missedDoses.length >= 3) {
        const medicineNames = [...new Set(missedDoses.map(d => d.medicine?.name).filter(Boolean))];
        const medicineList = medicineNames.length > 0 ? ` for ${medicineNames.join(', ')}` : '';
        
        alerts.push({
          alert_type: "medicine_pattern",
          message: `You've missed ${missedDoses.length} doses${medicineList} in the past week. Consistent medication is important for your health. Consider setting additional reminders.`,
          severity: "medium",
          suggested_action: "Enable notifications and set backup alarms for your medicine times."
        });
      }
    } else {
      console.log("No missed doses found");
    }

    // ============ DOCTOR REVIEW ALERTS ============
    if (reviewedCases && reviewedCases.length > 0) {
      // Check for newly reviewed cases in the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentReviews = reviewedCases.filter(c => 
        c.reviewed_at && new Date(c.reviewed_at) > oneDayAgo
      );

      for (const reviewedCase of recentReviews) {
        const expertType = reviewedCase.category === 'medical' ? 'Doctor' : 'Wellness Advisor';
        alerts.push({
          alert_type: "case_reviewed",
          message: `A ${expertType} has reviewed your health concern and provided professional feedback. Check your chat history to see their recommendations.`,
          severity: "low",
          suggested_action: "View the expert's notes in your chat history."
        });
      }
    }

    // ============ STRATEGIES NOT FOLLOWED ALERT ============
    // Check if user has completed any strategies recently (we'll use check-ins as a proxy)
    if (checkIns && checkIns.length > 0) {
      const todayCheckIns = checkIns.filter(c => 
        c.created_at.split('T')[0] === new Date().toISOString().split('T')[0]
      );
      
      // If no check-in today and it's past noon, remind about wellness activities
      const currentHour = new Date().getHours();
      if (todayCheckIns.length === 0 && currentHour >= 12) {
        alerts.push({
          alert_type: "strategies_reminder",
          message: "You haven't logged a check-in today yet. Taking a moment for self-reflection and following your wellness strategies can make a big difference!",
          severity: "low",
          suggested_action: "Complete a daily check-in and try one wellness strategy from your recommendations."
        });
      }
    }

    // ============ SYMPTOM PATTERN DETECTION ============
    if (messages && messages.length > 0) {
      const symptomCategories = {
        headache: { keywords: ['headache', 'migraine', 'head pain'], dates: new Set<string>() },
        fatigue: { keywords: ['tired', 'fatigue', 'exhausted', 'no energy'], dates: new Set<string>() },
        sleep: { keywords: ['sleep', 'insomnia', 'can\'t sleep'], dates: new Set<string>() },
        anxiety: { keywords: ['anxious', 'anxiety', 'worried', 'panic'], dates: new Set<string>() },
      };

      messages.forEach(msg => {
        const content = msg.content.toLowerCase();
        const date = msg.created_at.split('T')[0];
        
        Object.values(symptomCategories).forEach(category => {
          if (category.keywords.some(kw => content.includes(kw))) {
            category.dates.add(date);
          }
        });
      });

      if (symptomCategories.headache.dates.size >= 3) {
        alerts.push({
          alert_type: "recurring_symptom",
          message: "You've mentioned headaches on several different days. Recurring headaches are worth discussing with a healthcare provider.",
          severity: "medium",
          suggested_action: "Consider booking a consultation to discuss this symptom."
        });
      }

      if (symptomCategories.anxiety.dates.size >= 3) {
        alerts.push({
          alert_type: "mental_wellness",
          message: "Anxiety has come up in your recent conversations. Remember, support is available. Breathing exercises and professional guidance can both help.",
          severity: "medium",
          suggested_action: "Try the breathing exercises in your strategies, or consider speaking with a wellness advisor."
        });
      }
    }

    // ============ INACTIVITY DETECTION ============
    if (checkIns) {
      const daysSinceLastCheckIn = checkIns.length > 0
        ? Math.floor((Date.now() - new Date(checkIns[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastCheckIn >= 3 && daysSinceLastCheckIn < 7) {
        alerts.push({
          alert_type: "check_in_reminder",
          message: `It's been ${daysSinceLastCheckIn} days since your last check-in. Regular check-ins help us provide better support. We'd love to hear how you're doing!`,
          severity: "low",
          suggested_action: "Take a moment to log how you're feeling today."
        });
      }
    }

    // Filter out duplicate alerts
    const newAlerts = alerts.filter(alert => {
      const key = `${alert.alert_type}:${alert.message.substring(0, 50)}`;
      return !existingAlertKeys.has(key);
    });

    // Save new alerts
    if (newAlerts.length > 0) {
      const alertsToInsert = newAlerts.map(alert => ({
        alert_type: alert.alert_type,
        message: alert.suggested_action 
          ? `${alert.message}\n\n💡 Suggestion: ${alert.suggested_action}`
          : alert.message,
        severity: alert.severity,
        user_id: user.id,
      }));

      await supabase.from("alerts").insert(alertsToInsert);
    }

    console.log(`Pattern analysis complete: ${newAlerts.length} new alerts generated`);

    return new Response(
      JSON.stringify({ 
        alertsGenerated: newAlerts.length,
        patterns: {
          moodTrend: checkIns && checkIns.length > 0 ? 'analyzed' : 'insufficient_data',
          symptomPatterns: messages && messages.length > 0 ? 'analyzed' : 'insufficient_data',
          medicineCompliance: missedDoses ? 'analyzed' : 'insufficient_data',
          expertReviews: reviewedCases ? 'analyzed' : 'insufficient_data',
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-patterns function:", error);
    const safeMessage = getSafeErrorMessage(error, "pattern analysis");
    
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
