import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Brain, Zap, Coffee, Moon, Target, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

const moods = [
  { id: "focus", name: "Peak Focus", icon: Target, description: "Deep concentration for complex topics" },
  { id: "energize", name: "Power-Up", icon: Zap, description: "High energy learning and motivation" },
  { id: "calm", name: "Ambient Chill", icon: Moon, description: "Relaxed absorption and gentle learning" },
  { id: "morning", name: "Gentle Wake-Up", icon: Coffee, description: "Easy morning briefings" },
  { id: "deep", name: "Deep Dive", icon: Brain, description: "Complex concepts with full immersion" },
  { id: "background", name: "Background Listen", icon: Headphones, description: "Passive learning while multitasking" }
];

const topics = [
  { id: "tech", name: "Technology & AI", prompt: "Latest developments in technology and artificial intelligence" },
  { id: "business", name: "Business & Startups", prompt: "Recent business news and startup innovations" },
  { id: "science", name: "Science & Health", prompt: "Cutting-edge scientific discoveries and health insights" },
  { id: "history", name: "History & Culture", prompt: "Fascinating historical events and cultural trends" },
  { id: "personal", name: "Personal Growth", prompt: "Personal development and productivity strategies" },
  { id: "news", name: "Current Events", prompt: "Today's important news and global developments" }
];

export const MoodProfiler = () => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [duration, setDuration] = useState<number>(10);

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Build Your Neural Brief
          </h2>
          <p className="text-lg text-muted-foreground">
            Customize your learning experience for optimal brain engagement
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Mood Selection */}
          <Card className="p-8 bg-card/50 border-border/20 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">
              Choose Your Learning Mood
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`w-full min-h-[128px] md:min-h-[136px] px-5 py-4 rounded-xl border border-white/20 hover:border-white/40 transition flex flex-col items-center justify-center text-center gap-1 ${
                    selectedMood === mood.id 
                      ? 'border-primary shadow-glow bg-primary/10' 
                      : ''
                  }`}
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                    <mood.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <span className="text-base md:text-lg font-semibold">{mood.name}</span>
                  <span className="text-[13px] md:text-sm leading-snug text-white/80 whitespace-normal break-words [text-wrap:balance] max-w-[22ch] md:max-w-[24ch]">{mood.description}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Topic Selection */}
          <Card className="p-8 bg-card/50 border-border/20 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">
              Quick Topic Selection
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {topics.map((topic) => (
                <Button
                  key={topic.id}
                  variant={selectedTopic === topic.id ? "neural" : "outline"}
                  onClick={() => {
                    setSelectedTopic(topic.id);
                    setCustomInstructions(topic.prompt);
                  }}
                  className="h-auto py-4 text-sm"
                >
                  {topic.name}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Select a topic for recent insights, or describe your own experience below
            </p>
          </Card>

          {/* Custom Instructions */}
          <Card className="p-8 bg-card/50 border-border/20 backdrop-blur-sm">
            <div className="space-y-4">
              <div>
                <Label htmlFor="instructions" className="text-2xl font-semibold text-foreground">
                  Describe Your Experience
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  Tell us what you want to experience. Be specific about the vibe, energy, or focus you're seeking.
                </p>
              </div>
              <Textarea
                id="instructions"
                placeholder="e.g., 'Heavy metal energy melody and talk about Japanese hip hop trends' or 'Calm ambient focus for deep work on quantum physics'"
                value={customInstructions}
                onChange={(e) => {
                  setCustomInstructions(e.target.value);
                  setSelectedTopic(""); // Clear topic selection when typing custom
                }}
                className="min-h-[120px] resize-none"
              />
            </div>
          </Card>

          {/* Duration Selection */}
          <Card className="p-8 bg-card/50 border-border/20 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">
              Session Duration
            </h3>
            <div className="grid grid-cols-2 sm:flex sm:space-x-4 gap-3 sm:gap-0">
              {[5, 10, 15, 20].map((min) => (
                <Button
                  key={min}
                  variant={duration === min ? "neural" : "outline"}
                  onClick={() => setDuration(min)}
                  className="px-6 py-3 flex-1 sm:flex-none"
                >
                  {min} min
                </Button>
              ))}
            </div>
          </Card>

          {/* Generate Button */}
          <div className="text-center">
            <Link to={`/?mood=${selectedMood}&instructions=${encodeURIComponent(customInstructions)}&duration=${duration}`}>
              <Button 
                variant="neural" 
                size="lg" 
                className="px-12 py-6 text-lg"
                disabled={!customInstructions.trim() || !selectedMood}
              >
                Generate My SonicBrief
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};