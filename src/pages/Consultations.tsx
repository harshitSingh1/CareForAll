import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { consultationService } from "@/lib/supabase";
import { 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare, 
  Phone,
  Stethoscope,
  Brain,
  Heart,
  Baby,
  Bone,
  Eye,
  Plus,
  CheckCircle
} from "lucide-react";

interface Consultation {
  id: string;
  specialty: string;
  scheduled_at: string;
  purpose: string | null;
  status: string;
  created_at: string;
}

const specialties = [
  { id: 'General Medicine', name: 'General Medicine', icon: Stethoscope, description: 'Common health issues, check-ups' },
  { id: 'Mental Wellness', name: 'Mental Wellness', icon: Brain, description: 'Anxiety, depression, stress' },
  { id: 'Cardiology', name: 'Cardiology', icon: Heart, description: 'Heart and cardiovascular health' },
  { id: 'Pediatrics', name: 'Pediatrics', icon: Baby, description: 'Child health and development' },
  { id: 'Orthopedics', name: 'Orthopedics', icon: Bone, description: 'Bones, joints, muscles' },
  { id: 'Dermatology', name: 'Dermatology', icon: Eye, description: 'Skin, hair, nails' },
];

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM'
];

export default function Consultations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      loadConsultations();
    };
    checkAuth();
  }, [navigate]);

  const loadConsultations = async () => {
    try {
      const data = await consultationService.getConsultations();
      setConsultations(data);
    } catch (error) {
      console.error("Error loading consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSpecialty || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select specialty, date, and time",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Parse date and time
      const [hours, minutes] = selectedTime.replace(' AM', '').replace(' PM', '').split(':');
      let hour = parseInt(hours);
      if (selectedTime.includes('PM') && hour !== 12) hour += 12;
      if (selectedTime.includes('AM') && hour === 12) hour = 0;
      
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hour, parseInt(minutes), 0, 0);

      await consultationService.bookConsultation(selectedSpecialty, scheduledAt, purpose);
      
      toast({
        title: "Consultation Booked!",
        description: "You'll receive a confirmation shortly",
      });
      
      setBookingOpen(false);
      setSelectedSpecialty('');
      setSelectedDate('');
      setSelectedTime('');
      setPurpose('');
      loadConsultations();
    } catch (error) {
      console.error("Error booking consultation:", error);
      toast({
        title: "Booking Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSpecialtyInfo = (specialtyId: string) => {
    return specialties.find(s => s.id === specialtyId) || specialties[0];
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading consultations...</div>
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
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Consultations
              </h1>
              <p className="text-muted-foreground">
                Book appointments with verified healthcare professionals
              </p>
            </div>
            
            <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Book Consultation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Book a Consultation</DialogTitle>
                  <DialogDescription>
                    Select a specialty and schedule your appointment
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label>Select Specialty</Label>
                    <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((spec) => (
                          <SelectItem key={spec.id} value={spec.id}>
                            <div className="flex items-center gap-2">
                              <spec.icon className="w-4 h-4" />
                              {spec.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getMinDate()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Purpose (Optional)</Label>
                    <Textarea
                      placeholder="Briefly describe your concern..."
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleBooking}
                    disabled={submitting}
                  >
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Consultation Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6 text-center">
              <Video className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold">Video Call</h3>
              <p className="text-sm text-muted-foreground">Face-to-face virtual consultation</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold">Chat</h3>
              <p className="text-sm text-muted-foreground">Text-based consultation</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <Phone className="w-10 h-10 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold">Phone Call</h3>
              <p className="text-sm text-muted-foreground">Voice consultation</p>
            </CardContent>
          </Card>
        </div>

        {/* Specialties Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Available Specialties</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((spec, index) => (
              <motion.div
                key={spec.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
                  onClick={() => {
                    setSelectedSpecialty(spec.id);
                    setBookingOpen(true);
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <spec.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-sm">{spec.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{spec.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Consultations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4">Your Consultations</h2>
          
          {consultations.length > 0 ? (
            <div className="space-y-4">
              {consultations.map((consultation) => {
                const specInfo = getSpecialtyInfo(consultation.specialty);
                const scheduledDate = new Date(consultation.scheduled_at);
                const isPast = scheduledDate < new Date();
                
                return (
                  <Card key={consultation.id} className={isPast ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <specInfo.icon className="w-6 h-6 text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{specInfo.name}</h3>
                            {getStatusBadge(consultation.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {scheduledDate.toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          {consultation.purpose && (
                            <p className="text-sm text-muted-foreground">
                              Purpose: {consultation.purpose}
                            </p>
                          )}
                        </div>

                        {!isPast && consultation.status === 'scheduled' && (
                          <Button variant="outline" size="sm" className="gap-2">
                            <Video className="w-4 h-4" />
                            Join
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No consultations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Book your first consultation with a healthcare professional
                </p>
                <Button onClick={() => setBookingOpen(true)}>
                  Book Now
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}