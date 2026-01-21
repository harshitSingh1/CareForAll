import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSafeErrorMessage, getCorsHeaders } from "../_shared/security.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

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

    console.log("Generating personalized strategies for user:", user.id);

    // Rate limiting check - strategies generation is expensive
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _action: 'generate_strategies',
      _max_requests: 5,
      _window_minutes: 60
    });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      // Continue without rate limiting if check fails
    } else if (rateLimitCheck && !rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for strategies generation: user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Strategy generation rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recent check-ins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    // Get recent chat messages
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(30);

    // Build user context
    const moodPatterns = checkIns?.map(c => ({
      mood: c.mood,
      journal: c.journal,
      date: c.created_at
    })) || [];

    const chatTopics = messages?.map(m => m.content).join("\n") || "";

    // Analyze mood trends
    const moodCounts: Record<string, number> = {};
    moodPatterns.forEach(p => {
      moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
    });

    // Extract symptoms and topics from chat (with basic sanitization)
    const symptomKeywords = ['headache', 'pain', 'tired', 'fatigue', 'stress', 'anxiety', 
      'sleep', 'insomnia', 'depression', 'worry', 'tension', 'ache', 'nausea'];
    
    const detectedSymptoms: string[] = [];
    const sanitizedChatTopics = chatTopics.toLowerCase().slice(0, 5000); // Limit for safety
    
    symptomKeywords.forEach(keyword => {
      if (sanitizedChatTopics.includes(keyword)) {
        detectedSymptoms.push(keyword);
      }
    });

    // Build prompt for AI (sanitized - only use extracted data, not raw user input)
    const userContext = `
User Health Context:
- Recent mood patterns: ${JSON.stringify(moodCounts)}
- Journal entries hint at: ${moodPatterns.slice(0, 5).map(p => (p.journal || '').slice(0, 100)).filter(Boolean).join("; ")}
- Symptoms/topics mentioned in chats: ${detectedSymptoms.join(", ") || "general health questions"}
- Number of check-ins in last 30 days: ${checkIns?.length || 0}
`;

    const prompt = `Based on the following user health context, generate 6 personalized wellness strategies - 3 for mental wellness and 3 for physical health.

${userContext}

Generate strategies that directly address the user's patterns and concerns. Be specific and actionable.

Return a JSON object with this exact structure:
{
  "mental": [
    {
      "title": "Strategy title",
      "description": "2-3 sentence actionable description",
      "duration": "Time estimate (e.g., '5 min', '15 min', 'Ongoing')",
      "difficulty": "easy" | "medium" | "advanced",
      "reason": "Why this is recommended based on their data"
    }
  ],
  "physical": [
    {
      "title": "Strategy title",
      "description": "2-3 sentence actionable description", 
      "duration": "Time estimate",
      "difficulty": "easy" | "medium" | "advanced",
      "reason": "Why this is recommended based on their data"
    }
  ]
}

Only return the JSON object, no other text.`;

    console.log("Calling AI for personalized strategies");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a wellness expert. Generate personalized health strategies based on user data. Always respond with valid JSON only." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response received:", content.substring(0, 200));

    // Parse the JSON response
    let strategies;
    try {
      // Clean up the response if it has markdown code blocks
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      strategies = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return default strategies if parsing fails
      strategies = {
        mental: [
          {
            title: "Mindful Breathing",
            description: "Practice deep breathing exercises for 5 minutes. Inhale for 4 counts, hold for 4, exhale for 6.",
            duration: "5 min",
            difficulty: "easy",
            reason: "Helps reduce stress and anxiety"
          },
          {
            title: "Gratitude Journaling",
            description: "Write down 3 things you're grateful for today to shift focus to positive aspects of life.",
            duration: "10 min",
            difficulty: "easy",
            reason: "Improves mood and mental wellbeing"
          },
          {
            title: "Digital Detox Hour",
            description: "Spend one hour without screens. Read, walk, or engage in a hobby instead.",
            duration: "1 hour",
            difficulty: "medium",
            reason: "Reduces mental fatigue and improves focus"
          }
        ],
        physical: [
          {
            title: "Morning Stretch Routine",
            description: "Start your day with gentle stretches for neck, shoulders, and back to improve circulation.",
            duration: "10 min",
            difficulty: "easy",
            reason: "Improves flexibility and reduces muscle tension"
          },
          {
            title: "Walking Break",
            description: "Take a 15-minute walk outside. Fresh air and movement boost energy and mood.",
            duration: "15 min",
            difficulty: "easy",
            reason: "Increases energy and reduces sedentary time"
          },
          {
            title: "Hydration Check",
            description: "Track your water intake today. Aim for 8 glasses. Proper hydration improves focus and energy.",
            duration: "Ongoing",
            difficulty: "easy",
            reason: "Essential for physical health"
          }
        ]
      };
    }

    console.log("Strategies generated successfully");

    return new Response(
      JSON.stringify({ 
        strategies,
        context: {
          moodPatterns: moodCounts,
          detectedSymptoms,
          checkInCount: checkIns?.length || 0,
          chatMessagesAnalyzed: messages?.length || 0
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-strategies function:", error);
    const safeMessage = getSafeErrorMessage(error, "strategy generation");
    
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
