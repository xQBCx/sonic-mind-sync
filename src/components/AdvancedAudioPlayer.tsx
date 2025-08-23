import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AdvancedAudioPlayerProps {
  voiceUrl?: string;
  musicUrl?: string;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const AdvancedAudioPlayer = ({ 
  voiceUrl, 
  musicUrl, 
  isPlaying, 
  onPlayPause 
}: AdvancedAudioPlayerProps) => {
  const voiceRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  
  const [voiceVolume, setVoiceVolume] = useState([70]);
  const [musicVolume, setMusicVolume] = useState([30]);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);

  useEffect(() => {
    if (voiceRef.current) {
      voiceRef.current.volume = voiceMuted ? 0 : voiceVolume[0] / 100;
    }
    if (musicRef.current) {
      musicRef.current.volume = musicMuted ? 0 : musicVolume[0] / 100;
    }
  }, [voiceVolume, musicVolume, voiceMuted, musicMuted]);

  useEffect(() => {
    if (isPlaying) {
      voiceRef.current?.play();
      musicRef.current?.play();
    } else {
      voiceRef.current?.pause();
      musicRef.current?.pause();
    }
  }, [isPlaying]);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={onPlayPause}
          size="lg"
          className="w-16 h-16 rounded-full"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>
      </div>

      {/* Voice Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Voice Volume</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVoiceMuted(!voiceMuted)}
          >
            {voiceMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Slider
          value={voiceVolume}
          onValueChange={setVoiceVolume}
          max={100}
          step={1}
          className="w-full"
          disabled={voiceMuted}
        />
        <div className="text-sm text-muted-foreground text-center">
          {voiceMuted ? 'Muted' : `${voiceVolume[0]}%`}
        </div>
      </div>

      {/* Music Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Background Music Volume</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMusicMuted(!musicMuted)}
          >
            {musicMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Slider
          value={musicVolume}
          onValueChange={setMusicVolume}
          max={100}
          step={1}
          className="w-full"
          disabled={musicMuted}
        />
        <div className="text-sm text-muted-foreground text-center">
          {musicMuted ? 'Muted' : `${musicVolume[0]}%`}
        </div>
      </div>

      {/* Hidden Audio Elements */}
      {voiceUrl && (
        <audio
          ref={voiceRef}
          src={voiceUrl}
          preload="metadata"
          onEnded={() => onPlayPause()}
        />
      )}
      {musicUrl && (
        <audio
          ref={musicRef}
          src={musicUrl}
          preload="metadata"
          loop
        />
      )}
    </Card>
  );
};