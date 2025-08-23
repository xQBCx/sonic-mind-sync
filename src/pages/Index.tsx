import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MoodProfiler } from "@/components/MoodProfiler";
import { Header } from "@/components/Header";
import { playPreview } from "@/utils/previewTone";
import { generateAudio } from "@/lib/api";

const Index = () => {
  async function generateFullTrack() {
    const { url } = await generateAudio({ genre: "jazz", mood: "focus", text: "Hello world", voice: "soothing" });
    const audio = new Audio(url);
    audio.play();
  }
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <Hero />
      <HowItWorks />
      <MoodProfiler />
      <button onClick={playPreview}>Play Preview</button>
      <button onClick={generateFullTrack}>Generate Full Track</button>
    </div>
  );
};

export default Index;
