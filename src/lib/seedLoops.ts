// Seed script to populate initial loop assets
// This would normally be run once to populate the database with actual loop files
// For now, we'll create placeholder entries that reference files you'll upload to storage

import { supabase } from '@/integrations/supabase/client';

export const SAMPLE_LOOPS = [
  {
    path: 'loops/focus/ambient-pad-01.wav',
    mood: ['focus', 'calm'],
    key: 'C',
    bpm: 80,
    type: 'pad',
    duration_sec: 30,
    license: 'CC0 Public Domain',
    sha256: 'placeholder-focus-pad-01',
  },
  {
    path: 'loops/energy/upbeat-pulse-01.wav',
    mood: ['energy', 'focus'],
    key: 'G',
    bpm: 120,
    type: 'pulse',
    duration_sec: 20,
    license: 'CC0 Public Domain',
    sha256: 'placeholder-energy-pulse-01',
  },
  {
    path: 'loops/calm/soft-drone-01.wav',
    mood: ['calm'],
    key: 'Am',
    bpm: 60,
    type: 'drone',
    duration_sec: 40,
    license: 'CC0 Public Domain',
    sha256: 'placeholder-calm-drone-01',
  },
];

export async function seedLoopAssets() {
  console.log('Seeding loop assets...');
  
  for (const loop of SAMPLE_LOOPS) {
    const { error } = await supabase
      .from('loop_assets')
      .upsert(loop, { onConflict: 'sha256' });
    
    if (error) {
      console.error('Failed to seed loop:', loop.path, error);
    } else {
      console.log('Seeded:', loop.path);
    }
  }
  
  console.log('Loop assets seeded!');
}

// Note: You'll need to upload actual audio files to the 'loops' storage bucket
// matching the paths defined above. For now, the composer will work with just
// TTS + binaural beats if no loops are found.
