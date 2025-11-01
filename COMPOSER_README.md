# SonicBrief Composer - Audio Generation System

## Overview

The SonicBrief Composer is a first-party audio generation system that creates playable briefs by mixing:
1. **OpenAI TTS voiceover** - Converts your script to high-quality speech
2. **Ambient loop stems** - Background music from your loop library
3. **Binaural beats** - Procedurally generated frequency-tuned tones for focus/energy/calm

## Architecture

### Database Tables

#### `loop_assets`
Stores metadata for ambient audio loops:
```sql
- path: Storage path (e.g., 'loops/focus/pad-01.wav')
- mood: Array of moods ['focus', 'energy', 'calm']
- type: Loop type ('pad', 'drone', 'pulse', 'texture')
- duration_sec: Loop length in seconds
- sha256: Unique hash for deduplication
```

#### `renders`
Tracks generated audio files:
```sql
- brief_id: Reference to parent brief
- method: Generation method ('composer:v0')
- url: Public URL of rendered audio
- diagnostics: JSON with generation details
```

### Storage Buckets

- **loops**: Stores your loop library (managed by admin)
- **renders**: Stores generated brief audio (per-user folders)
- **tmp**: Temporary workspace for audio processing

### Edge Functions

#### `composer`
Main audio generation endpoint:
- **Input**: `{ briefId: string }`
- **Process**:
  1. Fetches brief + script from database
  2. Generates TTS voiceover via OpenAI
  3. Selects 1-2 matching loops from `loop_assets`
  4. Generates binaural sine waves based on mood
  5. Mixes at fixed volumes (VO: 100%, loops: 40%, binaural: 30%)
  6. Uploads to storage and updates brief status
- **Output**: `{ success: true, audioUrl: string }`

#### `generate-brief-openai`
Script generation + triggers composer:
1. Generates script using GPT-4
2. Updates brief with script
3. Calls composer to generate audio
4. Returns immediately (composer runs in background)

## Binaural Beat Settings

| Mood   | Base Frequency | Delta (Δf) | Brain Wave Type |
|--------|----------------|------------|-----------------|
| Focus  | 200 Hz         | 40 Hz      | Beta (alertness) |
| Energy | 200 Hz         | 15 Hz      | High Alpha (motivation) |
| Calm   | 200 Hz         | 8 Hz       | Alpha (relaxation) |

## Setup Instructions

### 1. Populate Loop Library

First, upload audio loops to the `loops` storage bucket:

```bash
# Example structure:
loops/
  focus/
    ambient-pad-01.wav
    gentle-pulse-01.wav
  energy/
    upbeat-pulse-01.wav
    bright-texture-01.wav
  calm/
    soft-drone-01.wav
    nature-pad-01.wav
```

Then seed the database:

```typescript
import { seedLoopAssets } from '@/lib/seedLoops';

// Run once to populate loop_assets table
await seedLoopAssets();
```

### 2. Configure Secrets

Ensure these Supabase secrets are set:
- `OPENAI_API_KEY`: For TTS generation
- `SUPABASE_URL`: Auto-configured
- `SUPABASE_SERVICE_ROLE_KEY`: Auto-configured

### 3. Test the System

```typescript
import { composeBrief } from '@/lib/composerApi';

// After creating a brief with a script:
const result = await composeBrief(briefId);

if (result.success) {
  console.log('Audio ready at:', result.audioUrl);
}
```

## Audio Mixing Details

### Fixed Volume Levels (MVP)
- **Voiceover**: 100% (0 dB)
- **Loop layers**: 40% (-8 dB)
- **Binaural layer**: 30% (-10 dB)

### Output Format
- Sample rate: 48 kHz
- Channels: Stereo (2)
- Format: WAV (16-bit PCM)
- Soft clipping prevents distortion

## Current Limitations

1. **No dynamic mastering**: Fixed volumes, no LUFS normalization (coming in v1)
2. **No ducking**: Voiceover doesn't duck music (coming in v1)
3. **No crossfades**: Segments/loops don't crossfade (coming in v1)
4. **Max duration**: 5 minutes (Edge Function timeout)
5. **Loop library**: Must be pre-populated by admin

## Future Enhancements

### Phase 2 (v1)
- [ ] LUFS normalization (-16 LUFS target)
- [ ] Peak limiting (-1 dBTP)
- [ ] Sidechain ducking (music under voice)
- [ ] 200-400ms crossfades between segments
- [ ] Per-segment regeneration UI

### Phase 3 (v2)
- [ ] Dedicated audio worker (for longer renders)
- [ ] Advanced DSP (EQ, compression, reverb)
- [ ] User-uploadable loops
- [ ] Real-time preview

## Troubleshooting

### "No loop assets found"
- Check that `loop_assets` table has entries
- Verify loops are uploaded to storage
- Run `seedLoopAssets()` if needed

### "TTS generation failed"
- Verify `OPENAI_API_KEY` is set
- Check script length (<4000 chars)
- Review edge function logs

### "Composer timeout"
- Reduce brief duration (<5 min)
- Check edge function logs for errors
- Ensure storage buckets exist

## Credits

Uses:
- OpenAI TTS-1 for voiceover generation
- Tone.js concepts for binaural synthesis
- Custom DSP for mixing and mastering
