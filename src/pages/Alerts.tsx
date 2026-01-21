import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Heart,
  Clock,
  Filter,
  Sparkles,
  MessageCircle,
  Calendar,
  Lightbulb,
  UserRound,
  Trash2,
  Pill,
  TrendingDown,
  Stethoscope
} from "lucide-react";

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

const alertTypeConfig: Record<string, { icon: typeof Bell; label: string; color: string }> = {
  wellness_check: { icon: Heart, label: "Wellness Check", color: "text-rose-500" },
  stress_pattern: { icon: AlertTriangle, label: "Stress Pattern", color: "text-amber-500" },
  mood_variability: { icon: Sparkles, label: "Mood Insight", color: "text-purple-500" },
  recurring_symptom: { icon: Heart, label: "Health Insight", color: "text-rose-500" },
  sleep_pattern: { icon: Clock, label: "Sleep Insight", color: "text-indigo-500" },
  energy_pattern: { icon: Sparkles, label: "Energy Pattern", color: "text-amber-500" },
  mental_wellness: { icon: Heart, label: "Mental Wellness", color: "text-teal-500" },
  social_wellness: { icon: UserRound, label: "Social Wellness", color: "text-blue-500" },
  work_life_balance: { icon: Calendar, label: "Work-Life Balance", color: "text-orange-500" },
  check_in_reminder: { icon: MessageCircle, label: "Friendly Reminder", color: "text-primary" },
  case_reviewed: { icon: CheckCircle, label: "Expert Review", color: "text-emerald-500" },
  mood: { icon: Heart, label: "Mood Pattern", color: "text-rose-500" },
  stress: { icon: AlertTriangle, label: "Stress Alert", color: "text-amber-500" },
  health: { icon: Heart, label: "Health Insight", color: "text-rose-500" },
  medicine_missed: { icon: Pill, label: "Medicine Alert", color: "text-red-500" },
  medicine_pattern: { icon: Pill, label: "Medicine Reminder", color: "text-orange-500" },
  consult_doctor: { icon: Stethoscope, label: "Consult Doctor", color: "text-red-500" },
  wellness_score_drop: { icon: TrendingDown, label: "Wellness Drop", color: "text-amber-500" },
  strategies_reminder: { icon: Lightbulb, label: "Wellness Tip", color: "text-primary" },
  default: { icon: Bell, label: "Notification", color: "text-primary" },
};

export default function Alerts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      loadAlerts();
      // Trigger pattern analysis to generate new alerts
      triggerPatternAnalysis();
    };
    checkAuth();
  }, [navigate]);

  const triggerPatternAnalysis = async () => {
    try {
      await supabase.functions.invoke('analyze-patterns');
      // Reload alerts after analysis
      setTimeout(loadAlerts, 1000);
    } catch (error) {
      console.error("Error triggering pattern analysis:", error);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;
      
      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, is_read: true } : a)
      );
      
      toast({
        title: "Alert marked as read",
        description: "You can find it in the read alerts tab",
      });
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .in("id", unreadIds);

      if (error) throw error;
      
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      
      toast({
        title: "All alerts marked as read",
      });
    } catch (error) {
      console.error("Error marking all alerts as read:", error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
      
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setSelectedAlerts(prev => prev.filter(id => id !== alertId));
      
      toast({
        title: "Alert deleted",
      });
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const deleteSelectedAlerts = async () => {
    if (selectedAlerts.length === 0) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("alerts")
        .delete()
        .in("id", selectedAlerts);

      if (error) throw error;
      
      setAlerts(prev => prev.filter(a => !selectedAlerts.includes(a.id)));
      setSelectedAlerts([]);
      
      toast({
        title: `${selectedAlerts.length} alert(s) deleted`,
      });
    } catch (error) {
      console.error("Error deleting alerts:", error);
      toast({
        title: "Error",
        description: "Failed to delete alerts",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const deleteAllAlerts = async () => {
    if (alerts.length === 0) return;
    
    setDeleting(true);
    try {
      const allIds = alerts.map(a => a.id);
      const { error } = await supabase
        .from("alerts")
        .delete()
        .in("id", allIds);

      if (error) throw error;
      
      setAlerts([]);
      setSelectedAlerts([]);
      
      toast({
        title: "All alerts deleted",
      });
    } catch (error) {
      console.error("Error deleting all alerts:", error);
      toast({
        title: "Error",
        description: "Failed to delete all alerts",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(a => a.id));
    }
  };

  const getAlertConfig = (alertType: string) => {
    return alertTypeConfig[alertType] || alertTypeConfig.default;
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15';
      case 'medium':
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15';
      default:
        return 'bg-primary/5 border-primary/20 hover:bg-primary/10';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return { label: "Worth attention", variant: "destructive" as const };
      case 'medium':
      case 'warning':
        return { label: "Good to know", variant: "secondary" as const };
      default:
        return { label: "For your info", variant: "outline" as const };
    }
  };

  const parseMessageForSuggestion = (message: string) => {
    const parts = message.split('\n\n💡 Suggestion: ');
    return {
      mainMessage: parts[0],
      suggestion: parts[1] || null,
    };
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.is_read;
    if (filter === 'read') return alert.is_read;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading your wellness insights...</div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Heart className="w-8 h-8 text-primary" />
                Wellness Insights
                <Badge variant="outline" className="ml-2 text-lg">
                  {alerts.length} total
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                Personalized observations to support your health journey (last 7 days)
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Mark all read ({unreadCount})
                </Button>
              )}
              {alerts.length > 0 && (
                <Button 
                  onClick={deleteAllAlerts} 
                  variant="outline" 
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete all
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Gentle Disclaimer */}
        <Card className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="py-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              These insights are based on patterns in your check-ins and conversations. They're meant to be helpful observations, not medical advice. 
              For any health concerns, please consult with a qualified healthcare professional.
            </p>
          </CardContent>
        </Card>

        {/* Selection Actions */}
        {selectedAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-muted flex items-center justify-between"
          >
            <span className="text-sm font-medium">
              {selectedAlerts.length} alert(s) selected
            </span>
            <Button 
              onClick={deleteSelectedAlerts} 
              variant="destructive" 
              size="sm"
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete selected
            </Button>
          </motion.div>
        )}

        <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as 'all' | 'unread' | 'read')}>
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="gap-2">
              <Filter className="w-4 h-4" />
              All ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <Bell className="w-4 h-4" />
              New ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Reviewed ({alerts.length - unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {filteredAlerts.length > 0 ? (
              <>
                {/* Select All */}
                <div className="mb-4 flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                    Select all
                  </label>
                </div>

                <div className="space-y-4">
                  {filteredAlerts.map((alert, index) => {
                    const config = getAlertConfig(alert.alert_type);
                    const Icon = config.icon;
                    const { mainMessage, suggestion } = parseMessageForSuggestion(alert.message);
                    const severityInfo = getSeverityLabel(alert.severity);
                    const isSelected = selectedAlerts.includes(alert.id);

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`transition-all ${getSeverityStyles(alert.severity)} ${!alert.is_read ? 'ring-2 ring-primary/20' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col items-center gap-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelectAlert(alert.id)}
                                />
                                <div className={`p-2 rounded-full bg-background/50 ${config.color}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  <Badge variant="outline" className={config.color}>
                                    {config.label}
                                  </Badge>
                                  <Badge variant={severityInfo.variant}>
                                    {severityInfo.label}
                                  </Badge>
                                  {!alert.is_read && (
                                    <Badge className="bg-primary">New</Badge>
                                  )}
                                </div>
                                
                                <p className="text-foreground mb-3 leading-relaxed">{mainMessage}</p>
                                
                                {suggestion && (
                                  <div className="bg-background/50 rounded-lg p-3 mb-3 flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-muted-foreground">{suggestion}</p>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {new Date(alert.created_at).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {(alert.severity === 'high' || alert.alert_type === 'consult_doctor') && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/consultations')}
                                        className="gap-2 text-xs"
                                      >
                                        <Calendar className="w-3 h-3" />
                                        Book Consultation
                                      </Button>
                                    )}
                                    {!alert.is_read && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => markAsRead(alert.id)}
                                        className="gap-2"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Got it
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteAlert(alert.id)}
                                      disabled={deleting}
                                      className="gap-2 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {filter === 'all' ? 'No insights yet' : `No ${filter} insights`}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {filter === 'all' 
                      ? 'Keep logging your check-ins and chatting with our wellness assistant. We\'ll share helpful observations as patterns emerge.'
                      : filter === 'unread'
                      ? 'All caught up! No new insights to review.'
                      : 'No insights have been marked as reviewed yet.'
                    }
                  </p>
                  {filter === 'all' && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/check-in')}
                    >
                      Log a Check-in
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Supportive Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Worth Your Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Patterns that might benefit from a chat with a healthcare professional. No pressure, just a friendly nudge.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Good to Know
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Helpful observations about your wellness patterns. Consider these gentle reminders for self-care.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                For Your Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                General wellness tips and reminders to keep you on track with your health journey.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
