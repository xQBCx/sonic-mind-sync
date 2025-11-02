import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Mic, Target, Zap, Moon, Coffee, Brain, Headphones } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createBrief, saveBriefToHistory } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import VoiceInterface from "@/components/VoiceInterface";
import { StimmyAvatar } from "@/components/StimmyAvatar";

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

export const InteractiveHero = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [duration, setDuration] = useState([120]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);

  // Auto-fill from URL params and trigger generation
  useEffect(() => {
    const moodParam = searchParams.get('mood');
    const instructionsParam = searchParams.get('instructions');
    const durationParam = searchParams.get('duration');
    
    if (moodParam && instructionsParam && durationParam && user) {
      setSelectedMood(moodParam);
      setCustomInstructions(instructionsParam);
      setDuration([parseInt(durationParam) * 60]); // Convert minutes to seconds
      
      // Auto-trigger generation
      setTimeout(() => {
        handleGenerateWithParams(
          moodParam,
          instructionsParam,
          parseInt(durationParam) * 60
        );
      }, 100);
    }
  }, [searchParams, user]);

  const handleGenerateWithParams = async (
    mood: string,
    instructions: string,
    durationSec: number
  ) => {
    if (!user) return;
    
    setIsGenerating(true);
    
    try {
      const result = await createBrief({
        mood,
        instructions,
        durationSec
      });

      await saveBriefToHistory({
        id: result.briefId,
        mood,
        topics: [instructions],
        durationSec,
        createdAt: new Date().toISOString(),
        status: 'queued'
      });

      toast({
        title: "SonicBrief generation started",
        description: "Creating your personalized audio brief..."
      });

      navigate(`/brief/${result.briefId}`);
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Unable to start brief generation. Please try again.",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      navigate('/auth?redirectTo=/');
      return;
    }
    
    if (!selectedMood || !customInstructions.trim()) {
      toast({
        title: "Please complete the form",
        description: "Select a mood and describe what you want to experience.",
        variant: "destructive"
      });
      return;
    }
    
    await handleGenerateWithParams(selectedMood, customInstructions, duration[0]);
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Personalized Audio Intelligence
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform any topic into neuroadaptive audio experiences that sync with your brain's natural learning patterns
          </p>
        </div>

        <Card className="max-w-2xl mx-auto p-8 bg-card/60 border-border/30 backdrop-blur-sm shadow-neural">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <StimmyAvatar size="md" />
              <div>
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Create Your SonicBrief
                </h2>
                <p className="text-sm text-muted-foreground">
                  Hi! I'm Stimmy, your AI learning companion
                </p>
              </div>
            </div>
            <p className="text-muted-foreground">
              {user ? "Generate your personalized audio brief" : "Sign up to start creating"}
            </p>
          </div>

          <div className="space-y-6">
            {/* Mood Selection */}
            <div>
              <h3 className="font-semibold mb-4">Choose Your Learning Mood</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {moods.map((mood) => {
                  const Icon = mood.icon;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      disabled={!user}
                      className={`p-4 rounded-xl border transition flex flex-col items-center justify-center text-center gap-2 ${
                        selectedMood === mood.id 
                          ? 'border-primary bg-primary/10 shadow-glow' 
                          : 'border-border/20 hover:border-border/40'
                      } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold">{mood.name}</span>
                      <span className="text-xs text-muted-foreground">{mood.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Selection */}
            <div>
              <h3 className="font-semibold mb-4">Quick Topic Selection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {topics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant={selectedTopic === topic.id ? "default" : "outline"}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      setCustomInstructions(topic.prompt);
                    }}
                    className="h-auto py-3 text-sm"
                    disabled={!user}
                  >
                    {topic.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select a topic for recent insights, or describe your own below
              </p>
            </div>

            {/* Custom Instructions */}
            <div>
              <Label htmlFor="hero-instructions" className="font-semibold mb-4 block">
                Describe Your Experience
              </Label>
              <Textarea
                id="hero-instructions"
                placeholder="e.g., 'Heavy metal energy melody and talk about Japanese hip hop trends' or 'Calm ambient focus for deep work on quantum physics'"
                value={customInstructions}
                onChange={(e) => {
                  setCustomInstructions(e.target.value);
                  setSelectedTopic(""); // Clear topic selection when typing custom
                }}
                className="min-h-[100px] resize-none"
                disabled={!user}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tell us what you want to experience. Be specific about the vibe, energy, or focus you're seeking.
              </p>
            </div>

            {/* Duration */}
            <div>
              <h3 className="font-semibold mb-4">Session Duration</h3>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((min) => (
                  <Button
                    key={min}
                    variant={duration[0] === min * 60 ? "default" : "outline"}
                    onClick={() => setDuration([min * 60])}
                    disabled={!user}
                    className="py-3"
                  >
                    {min} min
                  </Button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!user || !selectedMood || !customInstructions.trim() || isGenerating}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Your SonicBrief...
                </>
              ) : !user ? (
                "Sign Up to Create"
              ) : (
                "Generate My SonicBrief"
              )}
            </Button>

            {/* Voice Interface Option */}
            {user && !showVoiceInterface && (
              <div className="text-center border-t pt-6 mt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Or try our voice interface
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowVoiceInterface(true)}
                  className="px-6 py-3"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Talk to Stimmy
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Just speak naturally about what you want to learn
                </p>
              </div>
            )}

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                <Button 
                  variant="link" 
                  className="p-0 h-auto" 
                  onClick={() => navigate('/auth')}
                >
                  Create a free account
                </Button> to start generating personalized audio briefs
              </p>
            )}
          </div>
        </Card>

        {/* Voice Interface Section */}
        {user && showVoiceInterface && (
          <div className="max-w-2xl mx-auto mt-6">
            <Card className="p-6 bg-card/60 border-border/30 backdrop-blur-sm shadow-neural">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Voice Interface</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceInterface(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Close
                </Button>
              </div>
              <VoiceInterface />
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};