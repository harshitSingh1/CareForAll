import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Stethoscope, Heart, ArrowLeft, Shield } from "lucide-react";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user has doctor role
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        if (rolesError) throw rolesError;

        const hasDocRole = roles?.some(r => r.role === "doctor" || r.role === "admin");

        if (!hasDocRole) {
          await supabase.auth.signOut();
          toast.error("Access denied. This portal is for verified healthcare professionals only.");
          return;
        }

        toast.success("Welcome back, Doctor!");
        navigate("/doctor-workbench");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="border-primary/20 shadow-glow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary to-secondary rounded-2xl w-fit">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Doctor Portal</CardTitle>
            <CardDescription>
              Access the healthcare professional workbench
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@careforall.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In to Workbench"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Verified Professionals Only</p>
                  <p className="text-muted-foreground">
                    This portal is exclusively for verified healthcare professionals. Contact admin for access.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Heart className="w-4 h-4" />
                <span>CareForAll</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
