import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, SkipBack, Volume2, Waves, Music } from "lucide-react";

interface AudioSegment {
  id: string;
  segment_type: 'intro_music' | 'affirmation' | 'content' | 'outro' | 'ambient';
  sequence_order: number;
  audio_url?: string;
  script?: string;
  duration_sec?: number;
  status: 'pending' | 'generating' | 'ready' | 'error';
}

interface MultiSegmentAudioPlayerProps {
  segments: AudioSegment[];
  title?: string;
  flowType?: 'single' | 'morning' | 'midday' | 'study' | 'winddown';
  backgroundMusicUrl?: string;
}

export const MultiSegmentAudioPlayer = ({ 
  segments = [], 
  title = "Your SonicBrief",
  flowType = 'single',
  backgroundMusicUrl
}: MultiSegmentAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [backgroundVolume, setBackgroundVolume] = useState(30);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(20).fill(0));

  const currentSegment = segments[currentSegmentIndex];
  const totalSegments = segments.length;

  // Flow type configurations
  const flowConfigs = {
    single: { icon: Play, color: "bg-primary", name: "Standard Brief" },
    morning: { icon: Music, color: "bg-yellow-500", name: "Morning Flow" },
    midday: { icon: Waves, color: "bg-blue-500", name: "Midday Boost" },
    study: { icon: SkipForward, color: "bg-green-500", name: "Study Session" },
    winddown: { icon: Volume2, color: "bg-purple-500", name: "Wind Down" }
  };

  const flowConfig = flowConfigs[flowType];

  // Segment type labels
  const segmentLabels = {
    intro_music: "Intro Music",
    affirmation: "Affirmation",
    content: "Content",
    outro: "Outro",
    ambient: "Ambient"
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSegment?.audio_url) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Auto-advance to next segment
      if (currentSegmentIndex < totalSegments - 1) {
        setCurrentSegmentIndex(prev => prev + 1);
      } else {
        // End of flow
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setCurrentSegmentIndex(0);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSegmentIndex, currentSegment?.audio_url, totalSegments]);

  // Handle segment changes
  useEffect(() => {
    if (audioRef.current && currentSegment?.audio_url) {
      audioRef.current.src = currentSegment.audio_url;
      audioRef.current.load();
      
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentSegmentIndex, currentSegment?.audio_url, isPlaying]);

  // Background music control
  useEffect(() => {
    const bgAudio = backgroundAudioRef.current;
    if (!bgAudio || !backgroundMusicUrl) return;

    bgAudio.volume = backgroundVolume / 100;
    bgAudio.loop = true;

    if (isPlaying && (currentSegment?.segment_type === 'content' || currentSegment?.segment_type === 'affirmation')) {
      bgAudio.play().catch(console.error);
    } else {
      bgAudio.pause();
    }

    return () => {
      bgAudio.pause();
    };
  }, [isPlaying, currentSegment?.segment_type, backgroundMusicUrl, backgroundVolume]);

  // Update volumes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = backgroundVolume / 100;
    }
  }, [volume, backgroundVolume]);

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
    if (!audioRef.current || !currentSegment?.audio_url) return;
    
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

  const skipToSegment = (index: number) => {
    if (index >= 0 && index < totalSegments) {
      setCurrentSegmentIndex(index);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSegmentProgress = () => {
    return ((currentSegmentIndex + (progress / 100)) / totalSegments) * 100;
  };

  if (!segments.length) {
    return (
      <Card className="p-8 bg-card/80 border-border/20 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-muted-foreground">No audio segments available</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <audio ref={audioRef} preload="metadata" />
      {backgroundMusicUrl && (
        <audio ref={backgroundAudioRef} src={backgroundMusicUrl} preload="metadata" />
      )}
      
      <Card className="p-8 bg-card/80 border-border/20 backdrop-blur-sm">
        {/* Flow Type Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className={`p-2 rounded-full ${flowConfig.color}`}>
              <flowConfig.icon className="w-5 h-5 text-white" />
            </div>
            <Badge variant="secondary">{flowConfig.name}</Badge>
          </div>
          <h3 className="text-2xl font-bold mb-2 text-foreground">{title}</h3>
          <p className="text-muted-foreground">
            Multi-Segment Audio Experience • {totalSegments} Segments
          </p>
        </div>

        {/* Segment Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Segment {currentSegmentIndex + 1} of {totalSegments}
            </span>
            <Badge variant="outline">
              {segmentLabels[currentSegment?.segment_type] || 'Loading...'}
            </Badge>
          </div>
          <Progress value={getSegmentProgress()} className="h-3 bg-secondary/30 mb-2" />
          <Progress value={progress || 0} className="h-1 bg-secondary/20" />
        </div>

        {/* Segment Navigator */}
        <div className="flex justify-center gap-2 mb-6">
          {segments.map((segment, index) => (
            <Button
              key={segment.id}
              variant={index === currentSegmentIndex ? "default" : "outline"}
              size="sm"
              onClick={() => skipToSegment(index)}
              className="min-w-[60px]"
              disabled={segment.status !== 'ready'}
            >
              {index + 1}
            </Button>
          ))}
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

        {/* Time Display */}
        <div className="flex justify-between text-sm text-muted-foreground mb-6">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => skipToSegment(currentSegmentIndex - 1)}
            disabled={currentSegmentIndex === 0}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="default" 
            size="icon" 
            className="w-16 h-16 rounded-full"
            onClick={togglePlayPause}
            disabled={!currentSegment?.audio_url || currentSegment.status !== 'ready'}
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
            onClick={() => skipToSegment(currentSegmentIndex + 1)}
            disabled={currentSegmentIndex >= totalSegments - 1}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Controls */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground min-w-[60px]">Voice</span>
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
            <span className="text-sm text-muted-foreground min-w-[30px]">{volume}%</span>
          </div>

          {backgroundMusicUrl && (
            <div className="flex items-center space-x-3">
              <Music className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground min-w-[60px]">Music</span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={backgroundVolume}
                  onChange={(e) => setBackgroundVolume(Number(e.target.value))}
                  className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <span className="text-sm text-muted-foreground min-w-[30px]">{backgroundVolume}%</span>
            </div>
          )}
        </div>

        {/* Current Segment Info */}
        {currentSegment?.script && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Current: {segmentLabels[currentSegment.segment_type]}
              </span>
              <Waves className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSegment.script.substring(0, 100)}...
            </p>
          </div>
        )}
      </Card>
    </>
  );
};