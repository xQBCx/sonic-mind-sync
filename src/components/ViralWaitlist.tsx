import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Users, Zap, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ViralWaitlistProps {
  onSignup?: (email: string, referralCode?: string) => void;
  referralCode?: string;
}

export const ViralWaitlist = ({ onSignup, referralCode }: ViralWaitlistProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [userReferralCode, setUserReferralCode] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchWaitlistStats();
    if (user) {
      generateUserReferralCode();
    }
  }, [user]);

  const fetchWaitlistStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_stats');
      if (error) throw error;
      setWaitlistCount((data as any)?.waiting_list_count || 0);
    } catch (error) {
      console.error('Error fetching waitlist stats:', error);
      setWaitlistCount(1247); // Fallback
    }
  };

  const generateUserReferralCode = () => {
    if (user) {
      // Generate a simple referral code based on user ID
      const code = `${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
      setUserReferralCode(code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Create a temporary user for the waitlist
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36) + Math.random().toString(36), // Temporary password
      });

      if (authError) throw authError;

      // Create profile with waitlist origin and referral info
      if (authData.user) {
        await supabase.rpc('create_user_profile', {
          p_user_id: authData.user.id,
          p_origin: 'waitlist',
          p_interests: referralCode ? `Referred by: ${referralCode}` : 'Direct signup'
        });

        // Track referral if exists
        if (referralCode) {
          await supabase
            .from('user_analytics')
            .insert({
              user_id: authData.user.id,
              event_type: 'waitlist_referral',
              context: { referral_code: referralCode, email }
            });
        }
      }
      
      onSignup?.(email, referralCode);
      await fetchWaitlistStats(); // Refresh count
      
      toast({
        title: "Welcome to the SonicBrief Revolution! 🎯",
        description: "Check your email to verify your account. Share with 3 friends to unlock Founder status!",
      });
      
      setEmail("");
    } catch (error) {
      console.error('Waitlist signup error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareText = "I just joined the SonicBrief waitlist - personalized audio frequencies for peak performance! Join me: ";
  const shareUrl = user && userReferralCode 
    ? `${window.location.origin}?ref=${userReferralCode}`
    : window.location.origin;

  const handleShare = (platform: 'twitter' | 'linkedin' | 'copy') => {
    const fullText = `${shareText}${shareUrl}`;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(fullText);
        toast({
          title: "Copied to clipboard!",
          description: "Share this with your network to spread the word.",
        });
        break;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-primary/20 shadow-neural">
      <CardHeader className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-primary animate-pulse-glow" />
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Join the Sound Revolution
          </h2>
        </div>
        <p className="text-muted-foreground text-lg">
          Be among the first 1,000 to experience personalized audio frequencies 
          scientifically designed for peak performance.
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">{waitlistCount.toLocaleString()}</span>
            <span className="text-muted-foreground">already joined</span>
          </div>
          <Badge variant="secondary" className="animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            Invite-Only Beta
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email for early access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-input/50 border-primary/30 focus:border-primary"
              required
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {isSubmitting ? "Joining..." : "Join Waitlist"}
            </Button>
          </div>
        </form>

        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-3 text-center">
            Double Your Chances - Share & Skip the Line
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Invite 3 friends and unlock Founder status with lifetime perks
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="border-primary/30 hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              X (Twitter)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="border-primary/30 hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('copy')}
              className="border-primary/30 hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          🧠 Public Benefit Corp • 🔬 Patent-Pending Technology • 🚀 Mission-Driven
        </div>
      </CardContent>
    </Card>
  );
};