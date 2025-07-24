import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MoodProfiler } from "@/components/MoodProfiler";
import { AudioPlayer } from "@/components/AudioPlayer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Hero />
      <HowItWorks />
      <MoodProfiler />
      <AudioPlayer />
    </div>
  );
};

export default Index;
