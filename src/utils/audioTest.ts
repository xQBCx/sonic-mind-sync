// Quick test utility for the composer system
import { supabase } from '@/integrations/supabase/client';
import { composeBrief } from '@/lib/composerApi';

export async function testComposer() {
  console.log('=== Testing SonicBrief Composer ===');
  
  // 1. Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  console.log('✓ User authenticated:', user.id);
  
  // 2. Create a test brief
  console.log('Creating test brief...');
  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .insert({
      user_id: user.id,
      mood: 'focus',
      topics: ['AI technology', 'productivity'],
      duration_sec: 120,
      status: 'queued',
      script: 'Welcome to your focus brief. Today we explore AI technology and productivity. Artificial intelligence continues to transform how we work and learn. By understanding these tools, we can enhance our effectiveness and achieve more with less effort. Stay focused, stay curious, and keep learning.',
    })
    .select()
    .single();
  
  if (briefError || !brief) {
    console.error('Failed to create brief:', briefError);
    return;
  }
  console.log('✓ Brief created:', brief.id);
  
  // 3. Check loop assets
  const { data: loops, error: loopError } = await supabase
    .from('loop_assets')
    .select('*')
    .limit(5);
  
  if (loopError) {
    console.warn('Loop assets query failed:', loopError);
  } else {
    console.log(`✓ Found ${loops?.length || 0} loop assets`);
  }
  
  // 4. Call composer
  console.log('Calling composer...');
  const result = await composeBrief(brief.id);
  
  if (result.success) {
    console.log('✓ Composer succeeded!');
    console.log('Audio URL:', result.audioUrl);
  } else {
    console.error('✗ Composer failed:', result.error);
  }
  
  // 5. Check final brief status
  const { data: finalBrief } = await supabase
    .from('briefs')
    .select('status, audio_url')
    .eq('id', brief.id)
    .single();
  
  console.log('Final brief status:', finalBrief?.status);
  console.log('Audio URL:', finalBrief?.audio_url);
  
  return brief.id;
}

// Run in console: import { testComposer } from '@/utils/audioTest'; testComposer();
