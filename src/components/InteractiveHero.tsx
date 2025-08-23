import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Mic, MicOff, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createBrief, saveBriefToHistory } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import VoiceInterface from "@/components/VoiceInterface";
import { StimmyAvatar } from "@/components/StimmyAvatar";

const moods = [
  { id: 'focus', name: 'Focus', description: 'Concentration and clarity', color: 'bg-blue-500/20 text-blue-300' },
  { id: 'energy', name: 'Energy', description: 'Motivation and drive', color: 'bg-orange-500/20 text-orange-300' },
  { id: 'calm', name: 'Calm', description: 'Relaxation and peace', color: 'bg-purple-500/20 text-purple-300' }
] as const;

export const InteractiveHero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<'focus' | 'energy' | 'calm' | null>(null);
  const [topicsInput, setTopicsInput] = useState("");
  const [duration, setDuration] = useState([120]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);

  const topics = topicsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

  const handleGenerate = async () => {
    if (!user) {
      navigate('/auth?redirectTo=/');
      return;
    }
    
    if (!selectedMood || topics.length === 0) {
      toast({
        title: "Please complete the form",
        description: "Select a mood and add some topics to generate your SonicBrief.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await createBrief({
        mood: selectedMood,
        topics,
        durationSec: duration[0]
      });

      // Save to history
      await saveBriefToHistory({
        id: result.briefId,
        mood: selectedMood,
        topics,
        durationSec: duration[0],
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
    } finally {
      setIsGenerating(false);
    }
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
              <h3 className="font-semibold mb-4">Choose Your Mood</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {moods.map((mood) => (
                  <Button
                    key={mood.id}
                    variant={selectedMood === mood.id ? "default" : "outline"}
                    onClick={() => setSelectedMood(mood.id)}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    disabled={!user}
                  >
                    <span className="font-semibold">{mood.name}</span>
                    <span className="text-xs text-muted-foreground">{mood.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div>
              <h3 className="font-semibold mb-4">What Topics Interest You?</h3>
              <Input
                placeholder="AI, Technology, Health, Science... (comma-separated)"
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                disabled={!user}
              />
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="bg-primary/20">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <h3 className="font-semibold mb-4">Duration</h3>
              <Slider
                value={duration}
                onValueChange={setDuration}
                min={90}
                max={180}
                step={15}
                className="w-full"
                disabled={!user}
              />
              <div className="text-center mt-2">
                <span className="text-lg font-semibold text-primary">
                  {Math.floor(duration[0] / 60)}:{(duration[0] % 60).toString().padStart(2, '0')} minutes
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!user || !selectedMood || topics.length === 0 || isGenerating}
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