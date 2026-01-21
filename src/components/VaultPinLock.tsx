import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VaultPinLockProps {
  onUnlock: () => void;
}

export const VaultPinLock = ({ onUnlock }: VaultPinLockProps) => {
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [hasExistingPin, setHasExistingPin] = useState<boolean | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vault_pins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setHasExistingPin(!!data);
    } catch (error) {
      console.error("Error checking PIN:", error);
      setHasExistingPin(false);
    } finally {
      setLoading(false);
    }
  };

  // Simple hash function for PIN (using Web Crypto API)
  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSetupPin = async () => {
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "Please make sure both PINs are the same",
        variant: "destructive",
      });
      setConfirmPin("");
      return;
    }

    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const pinHash = await hashPin(pin);

      const { error } = await supabase
        .from("vault_pins")
        .insert({
          user_id: user.id,
          pin_hash: pinHash,
        });

      if (error) throw error;

      toast({
        title: "PIN created",
        description: "Your vault is now protected with a PIN",
      });

      onUnlock();
    } catch (error: any) {
      console.error("Error setting PIN:", error);
      toast({
        title: "Failed to set PIN",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter your 4-digit PIN",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const pinHash = await hashPin(pin);

      const { data, error } = await supabase
        .from("vault_pins")
        .select("pin_hash")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data.pin_hash === pinHash) {
        onUnlock();
      } else {
        toast({
          title: "Incorrect PIN",
          description: "Please try again",
          variant: "destructive",
        });
        setPin("");
      }
    } catch (error: any) {
      console.error("Error verifying PIN:", error);
      toast({
        title: "Verification failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Setup new PIN
  if (!hasExistingPin || isSettingUp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
                <KeyRound className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Set Up Vault PIN</CardTitle>
              <CardDescription>
                Create a 4-digit PIN to protect your personal health records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">Enter PIN</label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={pin}
                    onChange={setPin}
                    inputMode="numeric"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className={showPin ? "" : "text-security-disc"} />
                      <InputOTPSlot index={1} className={showPin ? "" : "text-security-disc"} />
                      <InputOTPSlot index={2} className={showPin ? "" : "text-security-disc"} />
                      <InputOTPSlot index={3} className={showPin ? "" : "text-security-disc"} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">Confirm PIN</label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={confirmPin}
                    onChange={setConfirmPin}
                    inputMode="numeric"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className={showPin ? "" : "text-security-disc"} />
                      <InputOTPSlot index={1} className={showPin ? "" : "text-security-disc"} />
                      <InputOTPSlot index={2} className={showPin ? "" : "text-security-disc"} />
                      <InputOTPSlot index={3} className={showPin ? "" : "text-security-disc"} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                onClick={() => setShowPin(!showPin)}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                {showPin ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPin ? "Hide PIN" : "Show PIN"}
              </Button>

              <Button
                onClick={handleSetupPin}
                className="w-full"
                disabled={pin.length !== 4 || confirmPin.length !== 4 || verifying}
              >
                {verifying ? "Setting up..." : "Create PIN"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Verify existing PIN
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Vault Locked</CardTitle>
            <CardDescription>
              Enter your 4-digit PIN to access your personal records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={setPin}
                inputMode="numeric"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className={showPin ? "" : "text-security-disc"} />
                  <InputOTPSlot index={1} className={showPin ? "" : "text-security-disc"} />
                  <InputOTPSlot index={2} className={showPin ? "" : "text-security-disc"} />
                  <InputOTPSlot index={3} className={showPin ? "" : "text-security-disc"} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={() => setShowPin(!showPin)}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              {showPin ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPin ? "Hide PIN" : "Show PIN"}
            </Button>

            <Button
              onClick={handleVerifyPin}
              className="w-full"
              disabled={pin.length !== 4 || verifying}
            >
              {verifying ? "Verifying..." : "Unlock Vault"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Your data is protected with Row Level Security</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
