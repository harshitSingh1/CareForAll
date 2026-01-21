import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Pill, 
  Plus, 
  Camera, 
  Clock, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  Trash2,
  Bell,
  BellRing,
  Edit,
  Upload,
  Loader2
} from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  dosage: string | null;
  instructions: string | null;
  times_per_day: number;
  schedule_times: string[];
  start_date: string;
  end_date: string | null;
  days_duration: number | null;
  is_active: boolean;
  created_at: string;
}

interface MedicineDose {
  id: string;
  medicine_id: string;
  scheduled_at: string;
  taken_at: string | null;
  status: "pending" | "taken" | "missed" | "skipped";
  notes: string | null;
  medicine?: Medicine;
}

interface ExtractedMedicine {
  name: string;
  dosage?: string;
  instructions?: string;
  frequency?: string;
}

const Medicines = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayDoses, setTodayDoses] = useState<MedicineDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for adding medicine
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    instructions: "",
    timesPerDay: 1,
    scheduleTimes: ["08:00"],
    startDate: new Date().toISOString().split("T")[0],
    daysDuration: 7
  });

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMedicines();
      fetchTodayDoses();
      
      // Check for missed doses and send reminders every minute
      const interval = setInterval(() => {
        checkForMissedDoses();
        checkForUpcomingDoses();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse the schedule_times from the database
      const parsedMedicines = (data || []).map(med => ({
        ...med,
        schedule_times: med.schedule_times || ["08:00"]
      }));
      
      setMedicines(parsedMedicines);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  const fetchTodayDoses = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from("medicine_doses")
        .select("*, medicine:medicines(*)")
        .gte("scheduled_at", startOfDay)
        .lte("scheduled_at", endOfDay)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      
      setTodayDoses((data || []).map(dose => ({
        ...dose,
        status: dose.status as "pending" | "taken" | "missed" | "skipped",
        medicine: dose.medicine as Medicine
      })));
    } catch (error) {
      console.error("Error fetching today's doses:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForMissedDoses = async () => {
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    try {
      // Find pending doses older than 4 hours
      const { data: missedDoses, error } = await supabase
        .from("medicine_doses")
        .select("*")
        .eq("status", "pending")
        .lt("scheduled_at", fourHoursAgo.toISOString());

      if (error) throw error;

      // Mark them as missed
      for (const dose of missedDoses || []) {
        await supabase
          .from("medicine_doses")
          .update({ status: "missed" })
          .eq("id", dose.id);

        // Create an alert for missed dose
        await supabase.from("alerts").insert({
          user_id: user?.id,
          alert_type: "medicine_missed",
          message: `You missed your dose scheduled for ${new Date(dose.scheduled_at).toLocaleTimeString()}`,
          severity: "medium"
        });
      }

      if ((missedDoses?.length || 0) > 0) {
        fetchTodayDoses();
      }
    } catch (error) {
      console.error("Error checking missed doses:", error);
    }
  };

  const checkForUpcomingDoses = () => {
    const now = new Date();
    
    todayDoses.forEach(dose => {
      if (dose.status !== "pending") return;
      
      const scheduledTime = new Date(dose.scheduled_at);
      const timeDiff = scheduledTime.getTime() - now.getTime();
      const minutesUntil = Math.floor(timeDiff / 60000);

      // Notify 5 minutes before
      if (minutesUntil >= 0 && minutesUntil <= 5) {
        sendNotification(
          "Medicine Reminder",
          `Time to take ${dose.medicine?.name || "your medicine"}!`
        );
      }
    });
  };

  const sendNotification = (title: string, body: string) => {
    // In-app toast
    toast({
      title,
      description: body,
      duration: 10000,
    });

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { 
        body, 
        icon: "/favicon.ico",
        tag: "medicine-reminder"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke("extract-medicine", {
          body: { imageBase64: base64 }
        });

        if (error) throw error;

        if (data.medicines && data.medicines.length > 0) {
          const firstMedicine = data.medicines[0] as ExtractedMedicine;
          setFormData(prev => ({
            ...prev,
            name: firstMedicine.name || "",
            dosage: firstMedicine.dosage || "",
            instructions: firstMedicine.instructions || "",
          }));
          
          toast({
            title: "Medicine Detected!",
            description: `Found ${data.medicines.length} medicine(s). ${data.confidence === "low" ? "Please verify the details." : ""}`,
          });

          if (data.medicines.length > 1) {
            toast({
              title: "Multiple Medicines",
              description: "We found multiple medicines. First one has been filled in. Add others manually.",
            });
          }
        } else {
          toast({
            variant: "destructive",
            title: "No medicine found",
            description: data.notes || "Could not extract medicine information. Please enter manually.",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error scanning medicine:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Could not process the image. Please enter details manually.",
      });
    } finally {
      setScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddMedicine = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Name Required",
        description: "Please enter a medicine name.",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Insert the medicine
      const { data: medicine, error: medicineError } = await supabase
        .from("medicines")
        .insert({
          user_id: user?.id,
          name: formData.name,
          dosage: formData.dosage || null,
          instructions: formData.instructions || null,
          times_per_day: formData.timesPerDay,
          schedule_times: formData.scheduleTimes,
          start_date: formData.startDate,
          days_duration: formData.daysDuration,
          end_date: new Date(new Date(formData.startDate).getTime() + formData.daysDuration * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        })
        .select()
        .single();

      if (medicineError) throw medicineError;

      // Generate doses for the duration
      const doses = [];
      const startDate = new Date(formData.startDate);
      
      for (let day = 0; day < formData.daysDuration; day++) {
        for (const time of formData.scheduleTimes) {
          const [hours, minutes] = time.split(":").map(Number);
          const doseDate = new Date(startDate);
          doseDate.setDate(doseDate.getDate() + day);
          doseDate.setHours(hours, minutes, 0, 0);
          
          doses.push({
            medicine_id: medicine.id,
            user_id: user?.id,
            scheduled_at: doseDate.toISOString(),
            status: "pending"
          });
        }
      }

      const { error: dosesError } = await supabase
        .from("medicine_doses")
        .insert(doses);

      if (dosesError) throw dosesError;

      toast({
        title: "Medicine Added!",
        description: `${formData.name} has been added with ${doses.length} scheduled doses.`,
      });

      setAddDialogOpen(false);
      setFormData({
        name: "",
        dosage: "",
        instructions: "",
        timesPerDay: 1,
        scheduleTimes: ["08:00"],
        startDate: new Date().toISOString().split("T")[0],
        daysDuration: 7
      });
      fetchMedicines();
      fetchTodayDoses();
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add medicine. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDose = async (doseId: string, status: "taken" | "skipped") => {
    try {
      const { error } = await supabase
        .from("medicine_doses")
        .update({ 
          status, 
          taken_at: status === "taken" ? new Date().toISOString() : null 
        })
        .eq("id", doseId);

      if (error) throw error;

      toast({
        title: status === "taken" ? "Medicine Taken! ✓" : "Dose Skipped",
        description: status === "taken" ? "Great job staying on track!" : "Dose marked as skipped.",
      });

      fetchTodayDoses();
    } catch (error) {
      console.error("Error updating dose:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update dose status.",
      });
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    try {
      const { error } = await supabase
        .from("medicines")
        .update({ is_active: false })
        .eq("id", medicineId);

      if (error) throw error;

      toast({
        title: "Medicine Removed",
        description: "Medicine has been removed from your list.",
      });

      fetchMedicines();
      fetchTodayDoses();
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove medicine.",
      });
    }
  };

  const updateScheduleTimes = (index: number, value: string) => {
    const newTimes = [...formData.scheduleTimes];
    newTimes[index] = value;
    setFormData(prev => ({ ...prev, scheduleTimes: newTimes }));
  };

  const addScheduleTime = () => {
    setFormData(prev => ({
      ...prev,
      timesPerDay: prev.timesPerDay + 1,
      scheduleTimes: [...prev.scheduleTimes, "12:00"]
    }));
  };

  const removeScheduleTime = (index: number) => {
    if (formData.scheduleTimes.length <= 1) return;
    const newTimes = formData.scheduleTimes.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      timesPerDay: prev.timesPerDay - 1,
      scheduleTimes: newTimes
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "taken": return "bg-green-500/20 text-green-500 border-green-500/30";
      case "missed": return "bg-red-500/20 text-red-500 border-red-500/30";
      case "skipped": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      default: return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const pendingDoses = todayDoses.filter(d => d.status === "pending");
  const completedDoses = todayDoses.filter(d => d.status === "taken" || d.status === "skipped" || d.status === "missed");

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Medicine Tracker
              </h1>
              <p className="text-muted-foreground mt-1">
                Never miss a dose with smart reminders
              </p>
            </div>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Medicine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Medicine</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Scan Option */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={scanning}
                    >
                      {scanning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {scanning ? "Scanning..." : "Scan Prescription"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => handleImageUpload(e as any);
                        input.click();
                      }}
                      disabled={scanning}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or enter manually
                      </span>
                    </div>
                  </div>

                  {/* Manual Entry Form */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Medicine Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Paracetamol"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input
                        id="dosage"
                        placeholder="e.g., 500mg"
                        value={formData.dosage}
                        onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        placeholder="e.g., Take after meals"
                        value={formData.instructions}
                        onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label>Schedule Times</Label>
                      <div className="space-y-2 mt-2">
                        {formData.scheduleTimes.map((time, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={time}
                              onChange={(e) => updateScheduleTimes(index, e.target.value)}
                              className="flex-1"
                            />
                            {formData.scheduleTimes.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeScheduleTime(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addScheduleTime}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Time
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration (days)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min={1}
                          max={365}
                          value={formData.daysDuration}
                          onChange={(e) => setFormData(prev => ({ ...prev, daysDuration: parseInt(e.target.value) || 7 }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMedicine} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Medicine
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Today's Schedule */}
          <Tabs defaultValue="today" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="today" className="gap-2">
                <BellRing className="h-4 w-4" />
                Today ({pendingDoses.length} pending)
              </TabsTrigger>
              <TabsTrigger value="medicines" className="gap-2">
                <Pill className="h-4 w-4" />
                All Medicines
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-6">
              {/* Pending Doses */}
              {pendingDoses.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Upcoming Doses
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                      {pendingDoses.map((dose) => (
                        <motion.div
                          key={dose.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                        >
                          <Card className="glass-card hover:shadow-soft transition-all">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{dose.medicine?.name}</h3>
                                  {dose.medicine?.dosage && (
                                    <p className="text-sm text-muted-foreground">{dose.medicine.dosage}</p>
                                  )}
                                </div>
                                <Badge variant="outline" className={getStatusColor(dose.status)}>
                                  {new Date(dose.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Badge>
                              </div>
                              {dose.medicine?.instructions && (
                                <p className="text-sm text-muted-foreground mb-3">{dose.medicine.instructions}</p>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 gap-1"
                                  onClick={() => handleMarkDose(dose.id, "taken")}
                                >
                                  <Check className="h-4 w-4" />
                                  Take
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 gap-1"
                                  onClick={() => handleMarkDose(dose.id, "skipped")}
                                >
                                  <X className="h-4 w-4" />
                                  Skip
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Completed/Missed Doses */}
              {completedDoses.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Earlier Today
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {completedDoses.map((dose) => (
                      <Card key={dose.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{dose.medicine?.name}</h3>
                              {dose.medicine?.dosage && (
                                <p className="text-sm text-muted-foreground">{dose.medicine.dosage}</p>
                              )}
                            </div>
                            <Badge variant="outline" className={getStatusColor(dose.status)}>
                              {dose.status === "taken" && <Check className="h-3 w-3 mr-1" />}
                              {dose.status === "missed" && <AlertCircle className="h-3 w-3 mr-1" />}
                              {dose.status.charAt(0).toUpperCase() + dose.status.slice(1)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {todayDoses.length === 0 && (
                <Card className="glass-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No medicines scheduled</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Add your medicines to get started with reminders
                    </p>
                    <Button onClick={() => setAddDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Medicine
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="medicines" className="space-y-4">
              {medicines.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {medicines.map((medicine) => (
                    <Card key={medicine.id} className="glass-card">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{medicine.name}</CardTitle>
                            {medicine.dosage && (
                              <CardDescription>{medicine.dosage}</CardDescription>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteMedicine(medicine.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {medicine.instructions && (
                          <p className="text-sm text-muted-foreground">{medicine.instructions}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {medicine.schedule_times.map((time, i) => (
                            <Badge key={i} variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {time}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(medicine.start_date).toLocaleDateString()} - 
                            {medicine.end_date ? new Date(medicine.end_date).toLocaleDateString() : "Ongoing"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No active medicines</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Add medicines to start tracking your schedule
                    </p>
                    <Button onClick={() => setAddDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medicine
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Medicines;
