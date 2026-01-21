import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, Stethoscope, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type AccountType = "user" | "professional";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handlePostAuthRedirect(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePostAuthRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePostAuthRedirect = async (userId: string) => {
    // Check user roles to determine redirect
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const userRoles = roles?.map(r => r.role) || [];
    const isDoctor = userRoles.includes("doctor");
    const isAdvisor = userRoles.includes("advisor");
    const isPro = isDoctor || isAdvisor;

    if (isPro) {
      // Check if they have a profile set up
      const { data: profile } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!profile) {
        navigate("/doctor-profile-setup");
        return;
      }

      // Redirect to appropriate workbench
      if (isDoctor) {
        navigate("/doctor-workbench");
      } else {
        navigate("/advisor-workbench");
      }
    } else {
      // Regular user - go to dashboard or intended destination
      navigate(from === "/" ? "/dashboard" : from);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              account_type: isProfessional ? "professional" : "user",
              professional_role: "doctor", // Default to doctor; can be changed during profile setup
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Assign appropriate role based on account type
          const roleToAssign = isProfessional ? "doctor" : "user";
          
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: roleToAssign,
            });

          if (roleError) {
            console.error("Error adding role:", roleError);
          }
        }

        toast({
          title: "Account created!",
          description: isProfessional 
            ? "Please sign in and complete your professional profile."
            : "You can now sign in to start your wellness journey.",
        });
        setIsSignUp(false);
        setIsProfessional(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-primary p-4 rounded-3xl mb-4">
              <Heart className="h-8 w-8 text-primary-foreground" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold mb-2">CareForAll</h1>
            <p className="text-muted-foreground text-center">
              {isSignUp ? "Start your wellness journey" : "Welcome back"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-2xl"
              />
            </div>

            {/* Professional account option - only show during signup */}
            {isSignUp && (
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                <Checkbox 
                  id="professional"
                  checked={isProfessional}
                  onCheckedChange={(checked) => setIsProfessional(!!checked)}
                />
                <label 
                  htmlFor="professional" 
                  className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                >
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span>I am a healthcare professional</span>
                </label>
              </div>
            )}

            {isSignUp && isProfessional && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs text-muted-foreground text-center px-2"
              >
                You'll choose your specialty (Doctor or Wellness Advisor) during profile setup
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsProfessional(false);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
