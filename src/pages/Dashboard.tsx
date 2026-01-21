import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Brain, 
  Activity,
  Calendar,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Lightbulb,
  Video,
  Bell,
  FolderLock,
  ArrowRight,
  Pill
} from "lucide-react";

interface CheckIn {
  id: string;
  mood: string;
  journal: string | null;
  created_at: string;
}

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

const moodIcons: Record<string, React.ReactNode> = {
  happy: <Smile className="w-5 h-5 text-green-500" />,
  calm: <Smile className="w-5 h-5 text-blue-500" />,
  neutral: <Meh className="w-5 h-5 text-yellow-500" />,
  anxious: <Frown className="w-5 h-5 text-orange-500" />,
  sad: <Frown className="w-5 h-5 text-red-500" />,
};

const moodScores: Record<string, number> = {
  happy: 100,
  calm: 80,
  neutral: 60,
  anxious: 40,
  sad: 20,
};

const featureCards = [
  {
    title: "Daily Check-In",
    description: "Track your mood and journal",
    icon: Heart,
    path: "/checkin",
    gradient: "from-secondary to-secondary/70",
  },
  {
    title: "Strategies",
    description: "Personalized wellness recommendations",
    icon: Lightbulb,
    path: "/strategies",
    gradient: "from-accent to-accent/70",
  },
  {
    title: "Consultations",
    description: "Book video calls with experts",
    icon: Video,
    path: "/consultations",
    gradient: "from-primary to-secondary",
  },
  {
    title: "Alerts",
    description: "View health & emotional alerts",
    icon: Bell,
    path: "/alerts",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "Medicine Tracker",
    description: "Never miss your daily medicines",
    icon: Pill,
    path: "/medicines",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "Personal Vault",
    description: "Secure access to your records",
    icon: FolderLock,
    path: "/vault",
    gradient: "from-slate-600 to-slate-800",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      loadData();
    };
    checkAuth();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [checkInsRes, alertsRes] = await Promise.all([
        supabase.from("check_ins").select("*").order("created_at", { ascending: false }).limit(30),
        supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      if (checkInsRes.data) setCheckIns(checkInsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMoodTrend = () => {
    if (checkIns.length < 2) return { trend: "neutral", change: 0, average: 0 };
    
    const recent = checkIns.slice(0, 7);
    const older = checkIns.slice(7, 14);
    
    const recentAvg = recent.reduce((sum, c) => sum + (moodScores[c.mood] || 50), 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, c) => sum + (moodScores[c.mood] || 50), 0) / older.length 
      : recentAvg;
    
    const change = Math.round(recentAvg - olderAvg);
    return {
      trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
      change: Math.abs(change),
      average: Math.round(recentAvg),
    };
  };

  const getStreakDays = () => {
    if (checkIns.length === 0) return 0;
    
    let streak = 1;
    const today = new Date();
    const lastCheckIn = new Date(checkIns[0].created_at);
    
    const diffDays = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return 0;
    
    for (let i = 1; i < checkIns.length; i++) {
      const current = new Date(checkIns[i - 1].created_at);
      const prev = new Date(checkIns[i].created_at);
      const diff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff <= 1) streak++;
      else break;
    }
    
    return streak;
  };

  const moodTrend = calculateMoodTrend();
  const streakDays = getStreakDays();
  const unreadAlerts = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Wellness Dashboard</h1>
          <p className="text-muted-foreground">Your central hub for health & mental wellness</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Wellness Score</p>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold">{moodTrend.average || 0}%</span>
                      {moodTrend.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : moodTrend.trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  <Heart className="w-8 h-8 text-primary/50" />
                </div>
                <Progress value={moodTrend.average || 0} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Check-in Streak</p>
                    <span className="text-2xl font-bold">{streakDays} days</span>
                  </div>
                  <Calendar className="w-8 h-8 text-secondary/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Check-ins</p>
                    <span className="text-2xl font-bold">{checkIns.length}</span>
                  </div>
                  <Brain className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className={`bg-gradient-to-br ${unreadAlerts > 0 ? 'from-destructive/20 to-destructive/5 border-destructive/30' : 'from-muted to-muted/50 border-muted'}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Alerts</p>
                    <span className="text-2xl font-bold">{unreadAlerts}</span>
                  </div>
                  <AlertTriangle className={`w-8 h-8 ${unreadAlerts > 0 ? 'text-destructive/50' : 'text-muted-foreground/30'}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Quick Access
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.path}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Link to={feature.path}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group overflow-hidden">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-3 group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Recent Check-ins
                  </span>
                  <Link to="/checkin" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkIns.length > 0 ? (
                  <div className="space-y-2">
                    {checkIns.slice(0, 4).map((checkIn) => (
                      <div key={checkIn.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        {moodIcons[checkIn.mood] || <Meh className="w-5 h-5" />}
                        <div className="flex-1 min-w-0">
                          <span className="capitalize font-medium text-sm">{checkIn.mood}</span>
                          {checkIn.journal && (
                            <p className="text-xs text-muted-foreground truncate">{checkIn.journal}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {new Date(checkIn.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6 text-sm">
                    No check-ins yet. Start your wellness journey!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Recent Alerts
                  </span>
                  <Link to="/alerts" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-3 rounded-lg border ${
                          alert.severity === 'high' 
                            ? 'bg-destructive/10 border-destructive/30' 
                            : 'bg-muted/50 border-muted'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs mb-1">
                              {alert.alert_type}
                            </Badge>
                            <p className="text-sm">{alert.message}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6 text-sm">
                    No alerts. All clear!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
