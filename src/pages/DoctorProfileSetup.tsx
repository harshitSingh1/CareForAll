import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Stethoscope, Heart, User, Award, Clock, CheckCircle } from "lucide-react";
import { medicalSpecialties, mentalWellnessSpecialties } from "@/lib/caseClassification";

// Use the centralized specialty lists from caseClassification
const doctorSpecialties = medicalSpecialties;
const advisorSpecialties = mentalWellnessSpecialties;

export default function DoctorProfileSetup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDoctor, isAdvisor, loading: roleLoading } = useUserRole();
  
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [secondarySpecialties, setSecondarySpecialties] = useState<string[]>([]);
  const [qualification, setQualification] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("available");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      
      if (!isDoctor && !isAdvisor) {
        toast.error("Access denied. Professional credentials required.");
        navigate("/");
        return;
      }

      checkExistingProfile();
    }
  }, [user, authLoading, roleLoading, isDoctor, isAdvisor, navigate]);

  const checkExistingProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setExistingProfile(true);
      setFullName(data.full_name);
      setSpecialty(data.specialty);
      setSecondarySpecialties((data as any).secondary_specialties || []);
      setQualification(data.qualification);
      setYearsOfExperience(data.years_of_experience.toString());
      setAvailabilityStatus(data.availability_status);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const profileData = {
        user_id: user.id,
        full_name: fullName.trim(),
        specialty: specialty,
        secondary_specialties: secondarySpecialties,
        qualification: qualification.trim(),
        years_of_experience: parseInt(yearsOfExperience) || 0,
        availability_status: availabilityStatus,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from("doctor_profiles")
          .update(profileData)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Profile updated successfully!");
      } else {
        const { error } = await supabase
          .from("doctor_profiles")
          .insert(profileData);

        if (error) throw error;
        toast.success("Profile created successfully!");
      }

      // Navigate to the appropriate workbench
      if (isDoctor) {
        navigate("/doctor-workbench");
      } else if (isAdvisor) {
        navigate("/advisor-workbench");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const isProfessional = isDoctor || isAdvisor;
  const RoleIcon = isDoctor ? Stethoscope : Heart;
  const roleLabel = isDoctor ? "Doctor" : "Wellness Advisor";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-gradient-primary p-4 rounded-3xl mb-4">
                {isProfessional && <RoleIcon className="h-8 w-8 text-primary-foreground" />}
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {existingProfile ? "Update" : "Complete"} Your {roleLabel} Profile
              </h1>
              <p className="text-muted-foreground text-center">
                {existingProfile 
                  ? "Update your professional information" 
                  : "Set up your professional profile to start reviewing cases"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Dr. John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Specialty
                </Label>
                <Select value={specialty} onValueChange={setSpecialty} required>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {(isAdvisor ? advisorSpecialties : doctorSpecialties).map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary Specialties */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Additional Specialties (optional)
                </Label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-2xl bg-muted/30 max-h-48 overflow-y-auto">
                  {(isAdvisor ? advisorSpecialties : doctorSpecialties)
                    .filter(spec => spec !== specialty)
                    .map((spec) => (
                      <div key={spec} className="flex items-center gap-2">
                        <Checkbox
                          id={`sec-${spec}`}
                          checked={secondarySpecialties.includes(spec)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSecondarySpecialties(prev => [...prev, spec]);
                            } else {
                              setSecondarySpecialties(prev => prev.filter(s => s !== spec));
                            }
                          }}
                        />
                        <Label htmlFor={`sec-${spec}`} className="text-sm cursor-pointer">
                          {spec}
                        </Label>
                      </div>
                    ))}
                </div>
                {secondarySpecialties.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {secondarySpecialties.length} additional {secondarySpecialties.length === 1 ? 'specialty' : 'specialties'} selected
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Qualification
                </Label>
                <Input
                  id="qualification"
                  placeholder="MBBS, MD, etc."
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  required
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Years of Experience
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="60"
                  placeholder="5"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  required
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Availability Status
                </Label>
                <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !fullName || !specialty || !qualification}
                className="w-full"
                size="lg"
              >
                {isSubmitting 
                  ? "Saving..." 
                  : existingProfile 
                    ? "Update Profile" 
                    : "Complete Setup"}
              </Button>
            </form>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
