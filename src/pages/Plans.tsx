import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, Sparkles, Shield, Crown } from "lucide-react";
import { Link } from "react-router-dom";

const Plans = () => {
  const plans = [
    {
      name: "AI Essentials",
      price: "Free",
      period: "forever",
      description: "Get started with AI-powered health guidance",
      icon: Sparkles,
      gradient: "from-primary to-primary-light",
      features: [
        "24/7 AI health assistant",
        "Basic symptom assessment",
        "Mental wellness tips",
        "Diet & nutrition guidance",
        "Home remedy suggestions",
        "Limited to 10 conversations/month",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Verified Care",
      price: "$29",
      period: "per month",
      description: "AI guidance with professional verification",
      icon: Shield,
      gradient: "from-secondary to-secondary-dark",
      features: [
        "Everything in AI Essentials",
        "Doctor verification within 4 hours",
        "Unlimited AI conversations",
        "Daily mental wellness check-ins",
        "Mood & health pattern tracking",
        "Preventive health alerts",
        "Priority support",
        "Encrypted health records vault",
      ],
      cta: "Start 7-Day Free Trial",
      highlighted: true,
      popular: true,
    },
    {
      name: "Complete Wellness",
      price: "$79",
      period: "per month",
      description: "Full spectrum health & mental wellness platform",
      icon: Crown,
      gradient: "from-accent to-accent-dark",
      features: [
        "Everything in Verified Care",
        "Unlimited video consultations",
        "Dedicated mental health advisor",
        "Personalized wellness plans",
        "Lab test integration",
        "Prescription management",
        "Family plan (up to 4 members)",
        "24/7 emergency consultation",
        "Annual comprehensive health review",
      ],
      cta: "Start Free Trial",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Choose Your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Wellness Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              From AI-powered guidance to complete healthcare coverage. Find the perfect fit for your needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold shadow-glow">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <Card
                  className={`p-8 h-full flex flex-col relative overflow-hidden ${
                    plan.highlighted
                      ? "border-2 border-primary shadow-glow scale-105"
                      : "border-border/50"
                  } bg-card/50 backdrop-blur-sm hover:shadow-card transition-all duration-300`}
                >
                  <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${plan.gradient} mb-4 w-fit`}>
                    <plan.icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/ {plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-2xl font-bold mb-6 text-center">Still deciding?</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">All plans include end-to-end encryption</div>
                    <div className="text-sm text-muted-foreground">Your health data is always private and secure</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Cancel anytime, no questions asked</div>
                    <div className="text-sm text-muted-foreground">We believe in earning your trust, not locking you in</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">7-day free trial on paid plans</div>
                    <div className="text-sm text-muted-foreground">Experience the full platform risk-free</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16 space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Questions about our plans?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our team is here to help you choose the right plan for your health journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
              <Link to="/chat">
                <Button variant="hero" size="lg">
                  Try AI Assistant Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Plans;
