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

const Index = () => {
  const { user, loading } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");

  useEffect(() => {
    // Extract referral code from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  if (loading) {
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
        <>
          <InteractiveHero />
          <div className="container mx-auto px-4 py-8 flex justify-center">
            <div className="w-full max-w-md">
              <ReferralTracker userEmail={user.email} />
            </div>
          </div>
        </>
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