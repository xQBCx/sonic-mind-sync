import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MoodProfiler } from "@/components/MoodProfiler";
import { Header } from "@/components/Header";
import { playPreview } from "@/utils/previewTone";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <Hero />
      <HowItWorks />
      <MoodProfiler />
      <button onClick={playPreview}>Play Preview</button>
    </div>
  );
};

export default Index;
