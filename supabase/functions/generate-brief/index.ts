import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateBriefRequest {
  mood: 'focus' | 'energy' | 'calm';
  topics: string[];
  durationSec: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate brief function called');
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for server-side operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create Supabase client with user's JWT for user-specific operations
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const { mood, topics, durationSec }: GenerateBriefRequest = await req.json();
    console.log('Request params:', { mood, topics, durationSec });

    // Validate input
    if (!mood || !topics || !durationSec) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['focus', 'energy', 'calm'].includes(mood)) {
      return new Response(JSON.stringify({ error: 'Invalid mood' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create brief record in database
    const { data: brief, error: insertError } = await supabaseUser
      .from('briefs')
      .insert({
        user_id: user.id,
        mood,
        topics,
        duration_sec: durationSec,
        status: 'queued',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert brief:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create brief' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Brief created:', brief.id);

    console.log('Starting audio generation with ElevenLabs...');

    // Generate script based on mood and topics
    const sampleScripts = {
      focus: `Welcome to your focus session. Today we're exploring ${topics.join(', ')}. Let's dive deep into concentration and clarity, eliminating distractions and maximizing your cognitive potential.`,
      energy: `Get ready to energize! Today's topics include ${topics.join(', ')}. Feel the motivation building as we explore dynamic concepts that will boost your energy and drive.`,
      calm: `Take a deep breath and relax. We'll be gently exploring ${topics.join(', ')} in a soothing manner that promotes peace and tranquility.`
    };

    const script = sampleScripts[mood] || 'Welcome to your personalized briefing.';

    // Update brief with processing status
    await supabaseUser
      .from('briefs')
      .update({
        status: 'processing',
        script,
      })
      .eq('id', brief.id);

    try {
      // Generate TTS audio with ElevenLabs
      const voiceId = '9BWtsMINqrJLrRacOk9x'; // Aria voice
      const model = 'eleven_multilingual_v2';
      
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY'),
        },
        body: JSON.stringify({
          text: script,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!ttsResponse.ok) {
        const errorData = await ttsResponse.text();
        console.error('ElevenLabs TTS error:', errorData);
        throw new Error(`TTS generation failed: ${ttsResponse.status}`);
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      
      console.log('TTS audio generated successfully');

      // Generate sound effects based on mood
      let soundEffectUrl = null;
      try {
        const soundEffectPrompts = {
          focus: 'soft ambient nature sounds, gentle rain, subtle concentration atmosphere',
          energy: 'upbeat motivational background, subtle energy boost sounds',
          calm: 'peaceful meditation ambience, soft breathing, tranquil atmosphere'
        };

        const sfxResponse = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY'),
          },
          body: JSON.stringify({
            text: soundEffectPrompts[mood],
            duration_seconds: Math.min(durationSec, 22), // ElevenLabs max duration
          }),
        });

        if (sfxResponse.ok) {
          const sfxBuffer = await sfxResponse.arrayBuffer();
          const sfxBase64 = btoa(String.fromCharCode(...new Uint8Array(sfxBuffer)));
          soundEffectUrl = `data:audio/mpeg;base64,${sfxBase64}`;
          console.log('Sound effects generated successfully');
        } else {
          console.log('Sound effects generation failed, continuing without SFX');
        }
      } catch (sfxError) {
        console.log('Sound effects error:', sfxError.message);
      }

      // Store the audio file as base64 data URL for now
      // In production, you'd upload to Supabase Storage
      const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

      // Update brief with ready status and generated content
      const { error: updateError } = await supabaseUser
        .from('briefs')
        .update({
          status: 'ready',
          script,
          audio_url: audioDataUrl,
          sound_effect_url: soundEffectUrl,
        })
        .eq('id', brief.id);

      if (updateError) {
        console.error('Failed to update brief:', updateError);
        throw new Error('Failed to update brief');
      }

      console.log('Brief completed successfully:', brief.id);

      return new Response(JSON.stringify({ 
        briefId: brief.id, 
        status: 'ready' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (audioError) {
      console.error('Audio generation error:', audioError);
      
      // Update brief with error status
      await supabaseUser
        .from('briefs')
        .update({
          status: 'error',
          script,
        })
        .eq('id', brief.id);

      return new Response(JSON.stringify({ error: 'Failed to generate audio' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-brief function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});