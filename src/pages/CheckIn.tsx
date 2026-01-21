import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Heart, Smile, Meh, Frown, Angry, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkInService } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Mood = "great" | "good" | "okay" | "sad" | "angry";

const CheckIn = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [journal, setJournal] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setIsAuthenticated(true);
      loadCheckIns();
    };
    checkAuth();
  }, [navigate]);

  const loadCheckIns = async () => {
    try {
      const data = await checkInService.getCheckIns();
      setEntries(data);
    } catch (error) {
      console.error('Error loading check-ins:', error);
    }
  };

  const moods = [
    { value: "great" as Mood, icon: Smile, label: "Great", color: "from-green-400 to-emerald-500", emoji: "😊" },
    { value: "good" as Mood, icon: Smile, label: "Good", color: "from-blue-400 to-cyan-500", emoji: "🙂" },
    { value: "okay" as Mood, icon: Meh, label: "Okay", color: "from-yellow-400 to-amber-500", emoji: "😐" },
    { value: "sad" as Mood, icon: Frown, label: "Sad", color: "from-orange-400 to-red-500", emoji: "😔" },
    { value: "angry" as Mood, icon: Angry, label: "Stressed", color: "from-red-500 to-pink-600", emoji: "😤" },
  ];

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Let us know how you're feeling today",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) return;

    try {
      await checkInService.saveCheckIn(selectedMood, journal);
      
      setShowSuccess(true);
      setTimeout(() => {
        setSelectedMood(null);
        setJournal("");
        setShowSuccess(false);
        loadCheckIns();
      }, 3000);

      toast({
        title: "Check-in saved! ✨",
        description: getEncouragingMessage(selectedMood),
      });
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast({
        title: "Error",
        description: "Failed to save check-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getEncouragingMessage = (mood: Mood): string => {
    const messages = {
      great: "That's wonderful! Keep nurturing this positive energy. 🌟",
      good: "Glad to hear you're doing well! Every good day counts. 💚",
      okay: "It's okay to have neutral days. Tomorrow is a fresh start. 🌤️",
      sad: "I see you're struggling. Remember, this feeling is temporary. You're not alone. 💙",
      angry: "Stress is tough. Take some deep breaths. You've got this. 🧘",
    };
    return messages[mood];
  };

  const getRecentTrend = () => {
    if (entries.length < 3) return null;
    const recent = entries.slice(-7);
    const moodScores = recent.map(e => {
      const scores = { great: 5, good: 4, okay: 3, sad: 2, angry: 1 };
      return scores[e.mood];
    });
    const avg = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    
    if (avg >= 4) return { text: "Your mood has been positive lately! 🌟", color: "text-green-500" };
    if (avg >= 3) return { text: "You're maintaining steady emotional balance 💚", color: "text-blue-500" };
    return { text: "Consider reaching out for support if you need it 💙", color: "text-orange-500" };
  };

  const trend = getRecentTrend();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-secondary p-2 rounded-2xl">
                <Heart className="h-6 w-6 text-secondary-foreground" fill="currentColor" />
              </div>
              <h1 className="text-3xl font-bold">Daily Wellness Check-In</h1>
            </div>
            <p className="text-muted-foreground">
              Track your emotional journey, one day at a time
            </p>
          </motion.div>

          {showSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-primary mb-6 animate-pulse-glow">
                <Heart className="h-12 w-12 text-primary-foreground" fill="currentColor" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Thank you for checking in!</h2>
              <p className="text-xl text-muted-foreground">
                {getEncouragingMessage(selectedMood!)}
              </p>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
                  <h2 className="text-2xl font-semibold mb-6">How are you feeling today?</h2>
                  
                  <div className="grid grid-cols-5 gap-4 mb-8">
                    {moods.map((mood) => (
                      <motion.button
                        key={mood.value}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMood(mood.value)}
                        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
                          selectedMood === mood.value
                            ? `bg-gradient-to-br ${mood.color} border-transparent text-white shadow-glow`
                            : "border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <span className="text-4xl">{mood.emoji}</span>
                        <span className="text-sm font-medium">{mood.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      What's on your mind? (optional)
                    </label>
                    <Textarea
                      value={journal}
                      onChange={(e) => setJournal(e.target.value)}
                      placeholder="Share your thoughts, feelings, or what happened today..."
                      className="min-h-32 rounded-2xl bg-muted/50 border-border/50 focus-visible:ring-primary resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedMood}
                    className="w-full mt-6"
                    size="lg"
                  >
                    Save Check-In
                  </Button>
                </Card>
              </div>

              <div className="space-y-6">
                {trend && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-border/50">
                      <div className="flex items-start gap-3 mb-3">
                        <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold mb-2">Your Trend</h3>
                          <p className={`text-sm ${trend.color}`}>{trend.text}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Recent Check-Ins</h3>
                  </div>
                  
                  {entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No check-ins yet. Start tracking your wellness today!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {entries.slice(0, 5).map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {moods.find(m => m.value === entry.mood)?.emoji}
                            </span>
                            <div>
                              <div className="text-sm font-medium capitalize">{entry.mood}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {entries.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {entries.length} total check-ins recorded
                      </p>
                    </div>
                  )}
                </Card>

                <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-border/50">
                  <h3 className="font-semibold mb-3 text-sm">💡 Wellness Tip</h3>
                  <p className="text-sm text-muted-foreground">
                    Daily check-ins help you identify patterns in your emotional health. 
                    Consider noting what triggers positive or negative feelings to better understand yourself.
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckIn;
