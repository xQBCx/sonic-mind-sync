import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, SkipBack, Volume2, Waves } from "lucide-react";

interface AudioPlayerProps {
  audioUrl?: string;
  title?: string;
}

export const AudioPlayer = ({ audioUrl = "/sample.mp3", title = "Your SonicBrief" }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(20).fill(0));

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Wave animation
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveHeights(prev => 
        prev.map(() => Math.random() * 40 + 10)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <Card className="p-8 bg-card/80 border-border/20 backdrop-blur-sm">
        {/* Now Playing Info */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2 text-foreground">
            {title}
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
          <Progress value={progress || 0} className="h-2 bg-secondary/30" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => skip(-10)}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="default" 
            size="icon" 
            className="w-16 h-16 rounded-full"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => skip(10)}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
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
    </>
  );
};