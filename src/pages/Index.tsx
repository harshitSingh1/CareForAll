import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Heart, 
  Shield, 
  Brain, 
  Stethoscope, 
  Clock, 
  Lock,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-wellness.jpg";

const Index = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Wellness",
      description: "Instant guidance for health queries and emotional support, available 24/7.",
      gradient: "from-primary to-primary-light",
    },
    {
      icon: Shield,
      title: "Doctor Verification",
      description: "Every critical recommendation reviewed by certified healthcare professionals.",
      gradient: "from-secondary to-secondary-dark",
    },
    {
      icon: Heart,
      title: "Mental Wellness",
      description: "Daily check-ins, mood tracking, and personalized coping strategies.",
      gradient: "from-accent to-accent-dark",
    },
    {
      icon: Clock,
      title: "Preventive Alerts",
      description: "Early pattern detection to help you stay ahead of health concerns.",
      gradient: "from-primary-light to-secondary",
    },
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      quote: "CareForAll helped me manage my anxiety with daily check-ins and supportive guidance. I feel more in control.",
      role: "Teacher",
    },
    {
      name: "Raj K.",
      quote: "The AI assistant gave me instant advice for my daughter's fever at 2 AM, then a doctor verified it in the morning.",
      role: "Parent",
    },
    {
      name: "Emily T.",
      quote: "Having both mental health support and medical guidance in one place changed my wellness journey completely.",
      role: "Designer",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Your Health Companion</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  CareForAll
                </span>
                <br />
                <span className="text-foreground">Your Health & Wellness Companion</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Get instant AI-powered health guidance, verified by real doctors, plus comprehensive mental wellness support. All in one trusted platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/chat">
                  <Button variant="hero" size="lg" className="group">
                    Start My Wellness Journey
                    <MessageSquare className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  </Button>
                </Link>
                <Link to="/plans">
                  <Button variant="outline" size="lg">
                    View Plans
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">AI Support</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">100%</div>
                  <div className="text-sm text-muted-foreground">Private & Secure</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">50K+</div>
                  <div className="text-sm text-muted-foreground">Happy Users</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-glow">
                <img 
                  src={heroImage} 
                  alt="CareForAll Digital Wellness Platform" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>
              
              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-md p-4 rounded-2xl shadow-card border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary p-2 rounded-xl">
                    <Activity className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Health Tracking</div>
                    <div className="text-xs text-muted-foreground">Real-time monitoring</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -top-6 -right-6 bg-card/90 backdrop-blur-md p-4 rounded-2xl shadow-card border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-secondary p-2 rounded-xl">
                    <Heart className="h-5 w-5 text-secondary-foreground" fill="currentColor" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Mental Wellness</div>
                    <div className="text-xs text-muted-foreground">Daily support</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Makes <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">CareForAll</span> Unique
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete health ecosystem that combines cutting-edge AI with human expertise
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50">
                  <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Assurance System */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Dual Assurance <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">System</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                The perfect balance of instant AI guidance and professional medical verification.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-gradient-primary p-2 rounded-xl shrink-0">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Step 1: AI Responds Instantly</h4>
                    <p className="text-muted-foreground">Get immediate guidance for health questions, symptoms, or emotional support needs.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-gradient-secondary p-2 rounded-xl shrink-0">
                    <Stethoscope className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Step 2: Doctor Verifies</h4>
                    <p className="text-muted-foreground">Licensed professionals review important recommendations within hours.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-gradient-accent p-2 rounded-xl shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Step 3: You Get Confidence</h4>
                    <p className="text-muted-foreground">Move forward with peace of mind knowing your health is in good hands.</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="p-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-border/50">
              <h3 className="text-2xl font-bold mb-6">Why This Matters</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">No more waiting hours in uncertainty for basic health guidance</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">Professional oversight ensures accuracy and safety</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">Affordable healthcare access for everyone, everywhere</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">Mental wellness support integrated with physical health</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Stories of <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Healing</span>
            </h2>
            <p className="text-xl text-muted-foreground">Real people, real transformations</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-card transition-all duration-300">
                  <div className="mb-4">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Heart key={i} className="h-4 w-4 text-accent" fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-border/50">
              <Lock className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Secure & Private Promise</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Your health data is encrypted, HIPAA-compliant, and never shared without your explicit consent. 
                Your wellness journey is yours alone.
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>End-to-End Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>Anonymous by Default</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Start Your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Wellness Journey</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands who've taken control of their health and emotional well-being.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/chat">
                <Button variant="hero" size="lg">
                  Start Free Today
                </Button>
              </Link>
              <Link to="/plans">
                <Button variant="outline" size="lg">
                  Explore Plans
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
