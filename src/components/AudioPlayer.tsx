import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, SkipBack, Volume2, Waves } from "lucide-react";

export const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(20).fill(0));

  // Simulate audio wave animation
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveHeights(prev => 
        prev.map(() => Math.random() * 40 + 10)
      );
      if (isPlaying) {
        setProgress(prev => (prev + 0.5) % 100);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-card/80 border-border/20 backdrop-blur-sm shadow-neural">
            {/* Now Playing Info */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                Your SonicBrief
              </h3>
              <p className="text-muted-foreground">
                AI-Generated Audio Brief • Ready to Play
              </p>
            </div>

            {/* Audio Visualization */}
            <div className="flex items-center justify-center space-x-1 mb-8 h-16">
              {waveHeights.map((height, index) => (
                <div
                  key={index}
                  className="w-1 bg-gradient-primary rounded-full transition-all duration-100 ease-in-out"
                  style={{ 
                    height: isPlaying ? `${height}px` : '4px',
                    animationDelay: `${index * 0.05}s`
                  }}
                ></div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progress} className="h-2 bg-secondary/30" />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>2:34</span>
                <span>10:00</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="neural" 
                size="icon" 
                className="w-16 h-16 rounded-full"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </Button>
              
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Progress value={volume} className="flex-1 h-2" />
              <Waves className="w-5 h-5 text-primary animate-pulse" />
            </div>

            {/* Neural Activity Indicator */}
            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Neural Activity</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                  <div className="w-2 h-2 bg-primary-glow rounded-full animate-ping delay-100"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping delay-200"></div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Alpha waves detected • Enhanced focus state
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};