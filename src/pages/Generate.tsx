import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { createBrief, saveBriefToHistory } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { Header } from "@/components/Header";


const moods = [
  { id: 'focus', name: 'Focus', description: 'Deep concentration and clarity' },
  { id: 'energy', name: 'Energy', description: 'Motivation and drive' },
  { id: 'calm', name: 'Calm', description: 'Relaxation and peace' }
] as const;

export default function Generate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<'focus' | 'energy' | 'calm' | null>(null);
  const [topicsInput, setTopicsInput] = useState("");
  const [duration, setDuration] = useState([120]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const topics = topicsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

  const handleGenerate = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    if (!selectedMood || topics.length === 0) return;
    
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

      if (scheduleEnabled) {
        localStorage.setItem('sonicbrief_schedule', JSON.stringify({
          time: scheduleTime,
          mood: selectedMood,
          topics,
          duration: duration[0]
        }));
      }

      toast({
        title: "Brief generation started",
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
    <div className="min-h-screen bg-gradient-background">
      <div className="text-white">Hello from Generate page</div>
      <Header />
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Generate Your SonicBrief
            </h1>
            <p className="text-xl text-muted-foreground">
              Create a personalized audio briefing tailored to your mood and interests
            </p>
          </div>

          <Card className="p-8 bg-card/80 border-border/20 backdrop-blur-sm shadow-neural">
            {/* Mood Selection */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-6 text-foreground">
                Choose Your Mood
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {moods.map((mood) => (
                  <Button
                    key={mood.id}
                    variant={selectedMood === mood.id ? "neural" : "outline"}
                    onClick={() => setSelectedMood(mood.id)}
                    className="h-auto p-6 flex flex-col items-center space-y-2"
                  >
                    <span className="text-lg font-semibold">{mood.name}</span>
                    <span className="text-sm text-muted-foreground">{mood.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Topics Input */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-6 text-foreground">
                What Topics Interest You?
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topics">Enter topics (comma-separated)</Label>
                  <Input
                    id="topics"
                    placeholder="AI, Technology, Markets, Health, Science..."
                    value={topicsInput}
                    onChange={(e) => setTopicsInput(e.target.value)}
                    className="mt-2"
                  />
                </div>
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic, index) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Duration Slider */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-6 text-foreground">
                Duration
              </h3>
              <div className="space-y-4">
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  min={90}
                  max={180}
                  step={15}
                  className="w-full"
                />
                <div className="text-center">
                  <span className="text-lg font-semibold text-primary">
                    {Math.floor(duration[0] / 60)}:{(duration[0] % 60).toString().padStart(2, '0')} minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <Collapsible open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 mb-4">
                  <span className="text-lg font-semibold">Schedule this daily (Optional)</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isScheduleOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mb-8 border-t border-border/20 pt-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="schedule-toggle">Enable daily schedule</Label>
                  <Switch
                    id="schedule-toggle"
                    checked={scheduleEnabled}
                    onCheckedChange={setScheduleEnabled}
                  />
                </div>
                {scheduleEnabled && (
                  <div>
                    <Label htmlFor="schedule-time">Daily time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="mt-2 w-auto"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Scheduling will be available post-launch
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedMood || topics.length === 0 || isGenerating}
              className="w-full py-6 text-lg"
              variant="neural"
            >
              {isGenerating ? "Generating Your Brief..." : "Generate My SonicBrief"}
            </Button>
          </Card>
        </div>
      </div>
      
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}