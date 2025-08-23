import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  disabled?: boolean;
}

const STIMMY_VOICES = [
  { id: 'alloy', name: 'Alloy - Natural & Balanced' },
  { id: 'echo', name: 'Echo - Warm & Engaging' },
  { id: 'fable', name: 'Fable - Expressive & Dynamic' },
  { id: 'onyx', name: 'Onyx - Deep & Authoritative' },
  { id: 'nova', name: 'Nova - Bright & Energetic' },
  { id: 'shimmer', name: 'Shimmer - Gentle & Soothing' }
];

export const VoiceSelector = ({ selectedVoice, onVoiceChange, disabled }: VoiceSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="voice-select">Choose Stimmy's Voice</Label>
      <Select
        value={selectedVoice}
        onValueChange={onVoiceChange}
        disabled={disabled}
      >
        <SelectTrigger id="voice-select">
          <SelectValue placeholder="Select a voice for Stimmy" />
        </SelectTrigger>
        <SelectContent>
          {STIMMY_VOICES.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              {voice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};