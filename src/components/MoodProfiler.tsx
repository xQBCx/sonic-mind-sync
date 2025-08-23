import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Coffee, Moon, Target, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

const moods = [
  { id: "focus", name: "Peak Focus", icon: Target, color: "bg-primary", description: "Deep concentration for complex topics" },
  { id: "energize", name: "Power-Up", icon: Zap, color: "bg-primary-glow", description: "High energy learning and motivation" },
  { id: "calm", name: "Ambient Chill", icon: Moon, color: "bg-secondary", description: "Relaxed absorption and gentle learning" },
  { id: "morning", name: "Gentle Wake-Up", icon: Coffee, color: "bg-accent", description: "Easy morning briefings" },
  { id: "deep", name: "Deep Dive", icon: Brain, color: "bg-primary", description: "Complex concepts with full immersion" },
  { id: "background", name: "Background Listen", icon: Headphones, color: "bg-muted", description: "Passive learning while multitasking" }
];

const topics = [
  "AI & Technology", "Business", "Science", "Politics", "Health", 
  "Climate", "Space", "Economics", "Education", "Startups"
];

export const MoodProfiler = () => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(10);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

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
            <div className="grid sm:grid-cols-3 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`min-h-[96px] md:min-h-[104px] w-full px-5 py-4 flex items-center justify-center text-center rounded-xl border-2 transition-all duration-300 hover:shadow-glow ${
                    selectedMood === mood.id 
                      ? 'border-primary shadow-glow bg-primary/10' 
                      : 'border-border/20 hover:border-primary/30'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${mood.color} flex items-center justify-center mb-2`}>
                      <mood.icon className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
                    </div>
                    <span className="block text-base md:text-lg leading-tight md:leading-snug whitespace-normal break-words max-w-[20ch] font-semibold text-foreground mb-1">{mood.name}</span>
                    <p className="text-xs md:text-sm text-muted-foreground">{mood.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Topic Selection */}
          <Card className="p-8 bg-card/50 border-border/20 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">
              Select Your Topics
            </h3>
            <div className="flex flex-wrap gap-3">
              {topics.map((topic) => (
                <Badge
                  key={topic}
                  variant={selectedTopics.includes(topic) ? "default" : "outline"}
                  className="cursor-pointer py-2 px-4 text-sm transition-all duration-200 hover:shadow-glow"
                  onClick={() => toggleTopic(topic)}
                >
                  {topic}
                </Badge>
              ))}
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
            <Link to="/generate">
              <Button 
                variant="neural" 
                size="lg" 
                className="px-12 py-6 text-lg"
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