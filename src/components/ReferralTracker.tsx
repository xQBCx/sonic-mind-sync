import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Gift, Crown, Share2 } from "lucide-react";
import { ShareModal } from "./ShareModal";

interface ReferralTrackerProps {
  userEmail?: string;
}

export const ReferralTracker = ({ userEmail }: ReferralTrackerProps) => {
  const [referralCount, setReferralCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // Generate referral code based on email
    if (userEmail) {
      const code = btoa(userEmail).slice(0, 8).toUpperCase();
      setReferralCode(code);
    }
  }, [userEmail]);

  const tiers = [
    { name: "Explorer", count: 0, perks: ["Early access"], icon: "🎧" },
    { name: "Advocate", count: 1, perks: ["Beta features", "Discord access"], icon: "🎯" },
    { name: "Champion", count: 3, perks: ["Founder badge", "Lifetime perks"], icon: "🏆" },
    { name: "Legend", count: 5, perks: ["All perks", "Advisory role"], icon: "👑" }
  ];

  const currentTier = tiers.slice().reverse().find(tier => referralCount >= tier.count) || tiers[0];
  const nextTier = tiers.find(tier => tier.count > referralCount);
  const progressToNext = nextTier ? (referralCount / nextTier.count) * 100 : 100;

  return (
    <>
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Referral Status</h3>
          </div>
          
          <div className="space-y-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {currentTier.icon} {currentTier.name}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {referralCount} referral{referralCount !== 1 ? 's' : ''} completed
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextTier.name}</span>
                <span>{referralCount}/{nextTier.count}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Current Perks:</h4>
            <ul className="space-y-1">
              {currentTier.perks.map((perk, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Gift className="h-3 w-3 text-primary" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {nextTier && (
            <div className="space-y-3 pt-3 border-t border-border">
              <h4 className="font-medium text-sm">Unlock at {nextTier.name}:</h4>
              <ul className="space-y-1">
                {nextTier.perks.map((perk, index) => (
                  <li key={index} className="text-sm text-muted-foreground/70 flex items-center gap-2">
                    <Gift className="h-3 w-3 text-muted-foreground" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button 
            onClick={() => setShowShareModal(true)}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share & Earn Perks
          </Button>

          {referralCode && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Your code: <span className="font-mono font-semibold text-primary">{referralCode}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        shareType="waitlist"
      />
    </>
  );
};