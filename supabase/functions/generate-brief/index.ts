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
    console.log('=== FUNCTION START ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const elevenlabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    console.log('Environment check:');
    console.log('- SUPABASE_URL present:', !!supabaseUrl);
    console.log('- SUPABASE_ANON_KEY present:', !!supabaseAnonKey);
    console.log('- ELEVENLABS_API_KEY present:', !!elevenlabsKey);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user authentication
    console.log('Verifying user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed', details: authError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!user) {
      console.error('No user found');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    console.log('Parsing request body...');
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw body text:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('Parsed body:', requestBody);
    } catch (parseError) {
      console.error('Body parse error:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid request body', details: parseError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { mood, topics, durationSec } = requestBody;
    console.log('Extracted params:', { mood, topics, durationSec });

    // Validate parameters
    if (!mood || !topics || !durationSec) {
      console.error('Missing parameters');
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        received: { mood: !!mood, topics: !!topics, durationSec: !!durationSec }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert brief into database
    console.log('Inserting brief...');
    const briefData = {
      user_id: user.id,
      mood,
      topics,
      duration_sec: durationSec,
      status: 'queued'
    };
    console.log('Brief data to insert:', briefData);

    const { data: brief, error: insertError } = await supabase
      .from('briefs')
      .insert(briefData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create brief', 
        details: insertError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Brief created successfully:', brief.id);

    // Start audio generation in background
    async function generateAudio() {
      try {
        console.log('Starting background audio generation...');
        
        // Generate script
        const sampleScripts = {
          focus: `Welcome to your focus session. Today we're exploring ${topics.join(', ')}. Let's dive deep into concentration and clarity, eliminating distractions and maximizing your cognitive potential.`,
          energy: `Get ready to energize! Today's topics include ${topics.join(', ')}. Feel the motivation building as we explore dynamic concepts that will boost your energy and drive.`,
          calm: `Take a deep breath and relax. We'll be gently exploring ${topics.join(', ')} in a soothing manner that promotes peace and tranquility.`
        };
        const script = sampleScripts[mood] || 'Welcome to your personalized briefing.';
        
        // Update status to TTS
        await supabase.from('briefs').update({ status: 'tts', script }).eq('id', brief.id);
        
        // Generate TTS with ElevenLabs
        const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
        if (!elevenlabsApiKey) {
          throw new Error('ElevenLabs API key not configured');
        }
        
        const voiceId = '9BWtsMINqrJLrRacOk9x'; // Aria voice
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenlabsApiKey,
          },
          body: JSON.stringify({
            text: script,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        });

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error('ElevenLabs error:', errorText);
          throw new Error(`TTS failed: ${ttsResponse.status}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
        const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;
        
        console.log('Audio generated successfully');
        
        // Update brief with ready status
        await supabase
          .from('briefs')
          .update({
            status: 'ready',
            script,
            audio_url: audioDataUrl,
          })
          .eq('id', brief.id);
          
        console.log('Brief completed successfully');
        
      } catch (error) {
        console.error('Background audio generation failed:', error);
        await supabase
          .from('briefs')
          .update({ 
            status: 'error', 
            error_message: error.message 
          })
          .eq('id', brief.id);
      }
    }
    
    // Start background task
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(generateAudio());
    } else {
      // Fallback: start background task without waitUntil
      generateAudio().catch(error => console.error('Background task failed:', error));
    }

    // Return immediate response
    console.log('=== FUNCTION SUCCESS ===');
    return new Response(JSON.stringify({ 
      briefId: brief.id, 
      status: 'queued'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      type: typeof error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});