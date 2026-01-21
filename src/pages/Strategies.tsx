import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  Heart, 
  Leaf, 
  Moon, 
  Sun, 
  Droplets,
  Wind,
  Music,
  BookOpen,
  Dumbbell,
  Coffee,
  Apple,
  Clock,
  Sparkles,
  RefreshCw,
  Lightbulb,
  Target,
  Check,
  Bed,
  Users,
  Utensils,
  Smartphone,
  Calendar
} from "lucide-react";

interface Strategy {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  category: 'mental' | 'physical';
  difficulty: 'easy' | 'medium' | 'advanced';
  reason?: string;
}

interface UniversalStrategy {
  id: string;
  title: string;
  description: string;
  whyItHelps: string;
  duration: string;
  icon: React.ReactNode;
  category: 'mental' | 'physical' | 'lifestyle';
  difficulty: 'easy' | 'medium';
}

interface AIStrategy {
  title: string;
  description: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  reason: string;
}

// Universal Healthy Life Strategies
const universalStrategies: UniversalStrategy[] = [
  {
    id: 'u1',
    title: 'Morning Sunlight + Fresh Air',
    description: 'Step outside within the first hour of waking. Let natural sunlight hit your eyes and take 10 deep breaths of fresh air.',
    whyItHelps: 'Resets your circadian rhythm and boosts alertness naturally!',
    duration: '10 min',
    icon: <Sun className="w-6 h-6" />,
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'u2',
    title: '5-Minute Mindful Breathing',
    description: 'Find a quiet spot, close your eyes, and focus only on your breath. Inhale for 4 counts, hold for 4, exhale for 6.',
    whyItHelps: 'Instantly calms your nervous system and clears mental fog.',
    duration: '5 min',
    icon: <Wind className="w-6 h-6" />,
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'u3',
    title: 'Daily Emotion Check-In',
    description: 'Take a moment to name your current emotions. Ask yourself: "What am I feeling right now and why?"',
    whyItHelps: 'Self-awareness is the first step to emotional regulation.',
    duration: '5 min',
    icon: <Heart className="w-6 h-6" />,
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'u4',
    title: 'Short Walk After Meals',
    description: 'Walk for 10-15 minutes after eating. Even a slow stroll around the block helps.',
    whyItHelps: 'Aids digestion and prevents energy crashes after eating.',
    duration: '10 min',
    icon: <Leaf className="w-6 h-6" />,
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'u5',
    title: 'Hydration Reminder',
    description: 'Drink a full glass of water right now. Set hourly reminders to stay hydrated throughout the day.',
    whyItHelps: 'Proper hydration improves focus, mood, and energy levels.',
    duration: 'ongoing',
    icon: <Droplets className="w-6 h-6" />,
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'u6',
    title: 'Stretching / Mobility Routine',
    description: 'Stretch your neck, shoulders, back, and legs. Hold each stretch for 15-30 seconds without bouncing.',
    whyItHelps: 'Releases muscle tension and improves blood circulation.',
    duration: '10 min',
    icon: <Dumbbell className="w-6 h-6" />,
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'u7',
    title: 'Screen-Free Wind-Down',
    description: 'Put away all screens 1 hour before bed. Read, journal, or do gentle stretches instead.',
    whyItHelps: 'Blue light blocks melatonin. This helps you fall asleep faster.',
    duration: '15 min',
    icon: <Smartphone className="w-6 h-6" />,
    category: 'lifestyle',
    difficulty: 'medium',
  },
  {
    id: 'u8',
    title: 'Balanced Plate Rule',
    description: 'Fill half your plate with vegetables, a quarter with protein, and a quarter with whole grains.',
    whyItHelps: 'Balanced meals stabilize blood sugar and sustain energy.',
    duration: 'ongoing',
    icon: <Utensils className="w-6 h-6" />,
    category: 'lifestyle',
    difficulty: 'easy',
  },
  {
    id: 'u9',
    title: 'Consistent Sleep Schedule',
    description: 'Go to bed and wake up at the same time every day, even on weekends. Aim for 7-8 hours.',
    whyItHelps: 'Regular sleep improves mood, focus, and immune function.',
    duration: 'ongoing',
    icon: <Bed className="w-6 h-6" />,
    category: 'lifestyle',
    difficulty: 'medium',
  },
  {
    id: 'u10',
    title: 'Journaling / Brain Dump',
    description: 'Write down everything on your mind for 10 minutes. Don\'t filter or organize—just let it flow.',
    whyItHelps: 'Clears mental clutter and reduces anxiety about tasks.',
    duration: '10 min',
    icon: <BookOpen className="w-6 h-6" />,
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'u11',
    title: 'Gratitude (3 Small Wins)',
    description: 'Write or mentally note 3 positive things from today, no matter how small.',
    whyItHelps: 'Rewires your brain to notice the good over time.',
    duration: '5 min',
    icon: <Sparkles className="w-6 h-6" />,
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'u12',
    title: 'Posture Reset + Deep Breaths',
    description: 'Sit or stand tall, roll shoulders back, and take 3 slow deep breaths. Repeat every hour.',
    whyItHelps: 'Good posture reduces back pain and increases oxygen intake.',
    duration: '1 min',
    icon: <Target className="w-6 h-6" />,
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'u13',
    title: 'One Social Connection',
    description: 'Reach out to one person today—a quick call, text, or coffee with a friend or family member.',
    whyItHelps: 'Human connection boosts mood and reduces loneliness.',
    duration: '15 min',
    icon: <Users className="w-6 h-6" />,
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'u14',
    title: 'Reduce Caffeine After Noon',
    description: 'Switch to water, herbal tea, or decaf after 12 PM to allow natural energy cycles.',
    whyItHelps: 'Caffeine has a 6-hour half-life and can disrupt sleep quality.',
    duration: 'ongoing',
    icon: <Coffee className="w-6 h-6" />,
    category: 'lifestyle',
    difficulty: 'medium',
  },
  {
    id: 'u15',
    title: 'Weekly Reset Plan',
    description: 'Spend 15-30 minutes each week to declutter your space and plan the upcoming week.',
    whyItHelps: 'Reduces overwhelm and sets you up for a productive week.',
    duration: '15 min',
    icon: <Calendar className="w-6 h-6" />,
    category: 'lifestyle',
    difficulty: 'easy',
  },
];

// Default fallback strategies
const defaultStrategies: Strategy[] = [
  {
    id: 'd1',
    title: '4-7-8 Breathing Technique',
    description: 'Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. This activates your parasympathetic nervous system.',
    duration: '5 min',
    icon: <Wind className="w-6 h-6" />,
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'd2',
    title: 'Gratitude Journaling',
    description: 'Write down 3 things you\'re grateful for today. This rewires your brain for positivity.',
    duration: '10 min',
    icon: <BookOpen className="w-6 h-6" />,
    category: 'mental',
    difficulty: 'easy',
  },
  {
    id: 'd3',
    title: 'Body Scan Meditation',
    description: 'Progressively relax each part of your body from head to toe. Helps release physical tension.',
    duration: '15 min',
    icon: <Sparkles className="w-6 h-6" />,
    category: 'mental',
    difficulty: 'medium',
  },
  {
    id: 'd4',
    title: 'Morning Stretching Routine',
    description: 'Gentle stretches to wake up your body. Focus on neck, shoulders, back, and legs.',
    duration: '10 min',
    icon: <Dumbbell className="w-6 h-6" />,
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'd5',
    title: 'Walking Break',
    description: 'Take a 15-minute walk outside. Natural light and movement boost mood.',
    duration: '15 min',
    icon: <Sun className="w-6 h-6" />,
    category: 'physical',
    difficulty: 'easy',
  },
  {
    id: 'd6',
    title: 'Hydration Check',
    description: 'Drink a full glass of water right now. Aim for 8 glasses daily.',
    duration: '1 min',
    icon: <Droplets className="w-6 h-6" />,
    category: 'physical',
    difficulty: 'easy',
  },
];

const categoryIcons = [Wind, BookOpen, Sparkles, Music, Leaf, Moon, Dumbbell, Sun, Droplets, Apple, Coffee, Clock, Heart, Brain, Target, Lightbulb];

const getRandomIcon = (index: number) => {
  const IconComponent = categoryIcons[index % categoryIcons.length];
  return <IconComponent className="w-6 h-6" />;
};

const categoryInfo = {
  mental: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Mental Wellness' },
  physical: { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Physical Health' },
};

const universalCategoryInfo = {
  mental: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Mental Wellness' },
  physical: { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Physical Health' },
  lifestyle: { icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Lifestyle' },
};

export default function Strategies() {
  const [strategies, setStrategies] = useState<Strategy[]>(defaultStrategies);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [completedStrategies, setCompletedStrategies] = useState<string[]>([]);
  const [completedUniversal, setCompletedUniversal] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [context, setContext] = useState<{
    moodPatterns?: Record<string, number>;
    detectedSymptoms?: string[];
    checkInCount?: number;
  } | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadStrategies();
  }, []);

  const checkAuthAndLoadStrategies = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    await generateStrategies();
  };

  const generateStrategies = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-strategies');

      if (error) {
        console.error('Error generating strategies:', error);
        toast({
          title: "Using default strategies",
          description: "Could not generate personalized strategies. Showing general recommendations.",
        });
        setStrategies(defaultStrategies);
        return;
      }

      if (data?.strategies) {
        const aiStrategies: Strategy[] = [];
        
        // Process mental strategies
        if (data.strategies.mental && Array.isArray(data.strategies.mental)) {
          data.strategies.mental.forEach((s: AIStrategy, idx: number) => {
            aiStrategies.push({
              id: `mental-${idx}`,
              title: s.title,
              description: s.description,
              duration: s.duration,
              difficulty: s.difficulty,
              category: 'mental',
              icon: getRandomIcon(idx),
              reason: s.reason,
            });
          });
        }

        // Process physical strategies
        if (data.strategies.physical && Array.isArray(data.strategies.physical)) {
          data.strategies.physical.forEach((s: AIStrategy, idx: number) => {
            aiStrategies.push({
              id: `physical-${idx}`,
              title: s.title,
              description: s.description,
              duration: s.duration,
              difficulty: s.difficulty,
              category: 'physical',
              icon: getRandomIcon(idx + 10),
              reason: s.reason,
            });
          });
        }

        if (aiStrategies.length > 0) {
          setStrategies(aiStrategies);
          setContext(data.context);
          
          if (isRefresh) {
            toast({
              title: "Strategies refreshed",
              description: "New personalized recommendations generated based on your recent activity.",
            });
          }
        } else {
          setStrategies(defaultStrategies);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setStrategies(defaultStrategies);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredStrategies = activeCategory === 'all' 
    ? strategies 
    : strategies.filter(s => s.category === activeCategory);

  const toggleComplete = (id: string) => {
    setCompletedStrategies(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const toggleUniversalComplete = (id: string) => {
    setCompletedUniversal(prev => {
      const isCompleting = !prev.includes(id);
      if (isCompleting) {
        toast({
          title: "Great job! 🎉",
          description: "Keep up the healthy habits!",
        });
      }
      return prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id];
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'medium': return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
      case 'advanced': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      default: return '';
    }
  };

  const universalProgress = completedUniversal.length;
  const universalTotal = universalStrategies.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Personalized Strategies Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Personalized Strategies
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              AI-powered recommendations based on your mood check-ins, chat history, and wellness patterns.
            </p>
            
            {/* Context info */}
            {context && (context.checkInCount || 0) > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Based on {context.checkInCount} check-ins
                </Badge>
                {context.detectedSymptoms && context.detectedSymptoms.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Addressing: {context.detectedSymptoms.slice(0, 3).join(", ")}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Category Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(categoryInfo).map(([key, info], index) => {
              const count = strategies.filter(s => s.category === key).length;
              const completed = strategies.filter(
                s => s.category === key && completedStrategies.includes(s.id)
              ).length;
              
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      activeCategory === key ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setActiveCategory(activeCategory === key ? 'all' : key)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-full ${info.bg} flex items-center justify-center mx-auto mb-3`}>
                        <info.icon className={`w-6 h-6 ${info.color}`} />
                      </div>
                      <h3 className="font-medium text-sm">{info.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {completed}/{count} completed
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Filter Pills with Refresh */}
          <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('all')}
              >
                All Strategies
              </Button>
              {Object.entries(categoryInfo).map(([key, info]) => (
                <Button
                  key={key}
                  variant={activeCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(key)}
                  className="gap-2"
                >
                  <info.icon className="w-4 h-4" />
                  {info.label}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateStrategies(true)}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="flex gap-2">
                        <Skeleton className="w-16 h-5 rounded" />
                        <Skeleton className="w-12 h-5 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-3/4 mt-3" />
                    <Skeleton className="h-16 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Strategies Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map((strategy, index) => {
                const info = categoryInfo[strategy.category];
                const isCompleted = completedStrategies.includes(strategy.id);
                
                return (
                  <motion.div
                    key={strategy.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <Card className={`h-full transition-all hover:shadow-lg ${
                      isCompleted ? 'bg-primary/5 border-primary/30' : ''
                    }`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className={`w-12 h-12 rounded-xl ${info.bg} flex items-center justify-center`}>
                            <span className={info.color}>{strategy.icon}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getDifficultyColor(strategy.difficulty)}>
                              {strategy.difficulty}
                            </Badge>
                            <Badge variant="outline">{strategy.duration}</Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg mt-3">{strategy.title}</CardTitle>
                        <CardDescription>{strategy.description}</CardDescription>
                        
                        {/* Personalization reason */}
                        {strategy.reason && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-primary bg-primary/5 p-2 rounded-lg">
                            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{strategy.reason}</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full"
                          variant={isCompleted ? 'outline' : 'default'}
                          onClick={() => toggleComplete(strategy.id)}
                        >
                          {isCompleted ? '✓ Completed Today' : 'Mark as Done'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Universal Strategies Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Healthy Everyday Strategies
              </h2>
              <p className="text-muted-foreground text-sm">
                Simple, practical habits anyone can follow for better well-being
              </p>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Check className="w-4 h-4 mr-1" />
              {universalProgress}/{universalTotal} completed
            </Badge>
          </div>

          {/* Scrollable Grid Container - Fixed Height for 2 Rows */}
          <ScrollArea className="h-[520px] rounded-lg border border-border/50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
              {universalStrategies.map((strategy, index) => {
                const info = universalCategoryInfo[strategy.category];
                const isCompleted = completedUniversal.includes(strategy.id);
                
                return (
                  <motion.div
                    key={strategy.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className={`h-full transition-all hover:shadow-md ${
                      isCompleted ? 'opacity-60 bg-primary/5 border-primary/30' : ''
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className={`w-10 h-10 rounded-lg ${info.bg} flex items-center justify-center shrink-0`}>
                            <span className={info.color}>{strategy.icon}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              {info.label}
                            </Badge>
                            <Badge className={`${getDifficultyColor(strategy.difficulty)} text-[10px] px-2 py-0.5`}>
                              {strategy.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                              {strategy.duration}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-base mt-2 leading-tight">
                          {isCompleted && <Check className="w-4 h-4 inline mr-1 text-primary" />}
                          {strategy.title}
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed">
                          {strategy.description}
                        </CardDescription>
                        <div className="mt-2 text-xs text-primary/80 bg-primary/5 p-2 rounded-md">
                          💡 {strategy.whyItHelps}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button 
                          className="w-full"
                          size="sm"
                          variant={isCompleted ? 'outline' : 'default'}
                          onClick={() => toggleUniversalComplete(strategy.id)}
                        >
                          {isCompleted ? '↩ Mark as Not Done' : '✓ Mark as Done'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Daily Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your Daily Reminder</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                These strategies are personalized based on your wellness journey. 
                Small steps lead to big changes. Even practicing one strategy today is progress.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}
