import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, duration } = await req.json();
    
    const cometApiKey = Deno.env.get('COMET_API_KEY');
    if (!cometApiKey) {
      throw new Error('CometAPI key not configured');
    }

    // Generate music based on mood using CometAPI -> Suno pipeline
    const musicPrompts = {
      focus: `Create a ${duration}-second instrumental ambient electronic track with subtle synthesizer pads, minimal percussion, flowing melodies, and gentle atmospheric sounds that enhance concentration and mental clarity. Make it loopable and suitable for background listening during study or work sessions.`,
      energy: `Generate a ${duration}-second high-energy instrumental electronic music track with driving beats, motivational rhythms, energizing synthesizers, and uplifting melodies that boost motivation and energy. Include dynamic build-ups and drops to maintain engagement.`,
      calm: `Produce a ${duration}-second peaceful instrumental ambient soundscape with gentle piano, soft strings, nature sounds, meditative tones, and flowing harmonies for relaxation and calm focus. Create a serene atmosphere perfect for meditation or unwinding.`
    };

    const prompt = musicPrompts[mood] || musicPrompts.focus;

    console.log('Generating music with CometAPI, prompt:', prompt);

    // Call CometAPI to generate music through Suno
    const cometResponse = await fetch('https://api.comet.ml/api/v1/suno/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cometApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: duration,
        make_instrumental: true, // For background music
        wait_audio: true // Wait for audio generation to complete
      }),
    });

    if (!cometResponse.ok) {
      const errorText = await cometResponse.text();
      console.error('CometAPI error:', errorText);
      throw new Error(`CometAPI request failed: ${cometResponse.status}`);
    }

    const cometData = await cometResponse.json();
    console.log('CometAPI response:', cometData);

    // Extract the audio URL from the response
    const musicUrl = cometData.audio_url || cometData.url || cometData.output_url;
    
    if (!musicUrl) {
      console.error('No audio URL in CometAPI response:', cometData);
      throw new Error('No audio URL returned from CometAPI');
    }
    
    return new Response(JSON.stringify({ 
      musicUrl,
      duration,
      mood,
      status: 'ready',
      metadata: {
        cometId: cometData.id,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Music generation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});