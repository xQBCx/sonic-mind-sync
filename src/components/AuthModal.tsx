// src/components/AuthModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Standalone auth modal content.
 * No external "isLogin" flag; we manage mode locally.
 */
export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Logged in" });
        onOpenChange(false);
        setEmail('');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "Account created", description: "You can now log in." });
        setMode("login");
      }
    } catch (err: any) {
      toast({ title: "Auth failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    if (!email) return toast({ title: "Enter your email first" });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    if (error) return toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    toast({ title: "Check your email", description: "Password reset link sent." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "Sign in to SonicBrief" : "Create your SonicBrief account"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <Button type="button" variant="link" className="px-0"
              onClick={() => setMode(m => (m === "login" ? "signup" : "login"))}>
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="button" variant="secondary" onClick={() => setShowPw(v => !v)}>
                {showPw ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="link" className="px-0" onClick={onForgot}>
              Forgot password?
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (mode === "login" ? "Logging in…" : "Signing up…") : (mode === "login" ? "Log in" : "Sign up")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}