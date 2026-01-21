import { Heart, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-primary p-2 rounded-2xl">
                <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CareForAll
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your everyday health and mental wellness companion. Combining AI-powered guidance with professional care.
            </p>
            <p className="text-xs text-muted-foreground italic">
              "Healing happens one day at a time."
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/chat" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link to="/checkin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Daily Check-In
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Subscription Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* For Professionals */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">For Professionals</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/doctor-login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Doctor Portal
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Join Our Network
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Partner With Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                support@careforall.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                1-800-CARE-4ALL
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Available Worldwide
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} CareForAll. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Emergency? Call 911 or your local emergency services immediately.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
