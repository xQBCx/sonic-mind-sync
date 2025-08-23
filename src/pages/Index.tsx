import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MoodProfiler } from "@/components/MoodProfiler";
import { Header } from "@/components/Header";
import { InteractiveHero } from "@/components/InteractiveHero";
import { ViralWaitlist } from "@/components/ViralWaitlist";
import { SocialProof } from "@/components/SocialProof";
import { ReferralTracker } from "@/components/ReferralTracker";
import { PromoVideoModal } from "@/components/PromoVideoModal";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

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
          <div className="container mx-auto px-4 py-8">
            <ReferralTracker userEmail={user.email} />
          </div>
        </>
      ) : (
        <>
          <Hero />
          <div className="container mx-auto px-4 py-16">
            <SocialProof />
          </div>
          <div className="container mx-auto px-4 py-16">
            <ViralWaitlist />
          </div>
        </>
      )}
      <HowItWorks />
      <MoodProfiler />
    </div>
  );
};

export default Index;
