import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MoodProfiler } from "@/components/MoodProfiler";
import { Header } from "@/components/Header";
import { InteractiveHero } from "@/components/InteractiveHero";
import { ViralWaitlist } from "@/components/ViralWaitlist";
import { SocialProof } from "@/components/SocialProof";
import { ReferralTracker } from "@/components/ReferralTracker";
import { PromoVideoModal } from "@/components/PromoVideoModal";
import { MobileSignInButton } from "@/components/MobileSignInButton";
import { RealTimeStats } from "@/components/RealTimeStats";
import { RealTestimonials } from "@/components/RealTestimonials";
import { TestimonialForm } from "@/components/TestimonialForm";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PendingApproval } from "@/components/PendingApproval";

const Index = () => {
  const { user, loading } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    // Extract referral code from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setIsPending(data?.role === 'pending');
      }
      setCheckingRole(false);
    };

    checkUserRole();
  }, [user]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {!user && <PromoVideoModal />}
      <Header />
      {user ? (
        isPending ? (
          <PendingApproval />
        ) : (
          <>
            <InteractiveHero />
            <div className="container mx-auto px-4 py-8 flex justify-center">
              <div className="w-full max-w-md">
                <ReferralTracker userEmail={user.email} />
              </div>
            </div>
          </>
        )
      ) : (
        <>
          <Hero />
          <div className="container mx-auto px-4 py-8 sm:py-16">
            <RealTimeStats />
            <RealTestimonials />
          </div>
          <div className="container mx-auto px-4 py-8 sm:py-16">
            <ViralWaitlist referralCode={referralCode} />
          </div>
          <div className="container mx-auto px-4 py-8 sm:py-16">
            <TestimonialForm />
          </div>
          <MobileSignInButton />
        </>
      )}
      <HowItWorks />
    </div>
  );
};

export default Index;