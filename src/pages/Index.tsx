import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MoodProfiler } from "@/components/MoodProfiler";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <Hero />
      <HowItWorks />
      <MoodProfiler />
    </div>
  );
};

export default Index;
