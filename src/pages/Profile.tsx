import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, LogOut, Settings, Heart } from "lucide-react";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  My Profile
                </span>
              </h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            <div className="grid gap-6">
              {/* Profile Card */}
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
                <div className="flex items-center gap-6 mb-6">
                  <div className="bg-gradient-primary p-4 rounded-2xl">
                    <User className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Welcome back!</h2>
                    <p className="text-muted-foreground">Your wellness journey continues</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                    <Calendar className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Member since</p>
                      <p className="font-medium">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => navigate("/chat")}
                  >
                    <Heart className="h-5 w-5 mr-3 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">AI Assistant</p>
                      <p className="text-xs text-muted-foreground">Get health guidance</p>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => navigate("/checkin")}
                  >
                    <Settings className="h-5 w-5 mr-3 text-secondary" />
                    <div className="text-left">
                      <p className="font-medium">Daily Check-In</p>
                      <p className="text-xs text-muted-foreground">Track your wellness</p>
                    </div>
                  </Button>
                </div>
              </Card>

              {/* Sign Out */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
