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
    console.log('=== OPENAI TTS FUNCTION START ===');
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('Environment check:');
    console.log('- SUPABASE_URL present:', !!supabaseUrl);
    console.log('- SUPABASE_ANON_KEY present:', !!supabaseAnonKey);
    console.log('- OPENAI_API_KEY present:', !!openaiKey);
    
    if (!supabaseUrl || !supabaseAnonKey || !openaiKey) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const requestBody = await req.json();
    const { mood, topics, durationSec } = requestBody;

    // Insert brief into database
    const briefData = {
      user_id: user.id,
      mood,
      topics,
      duration_sec: durationSec,
      status: 'queued'
    };

    const { data: brief, error: insertError } = await supabase
      .from('briefs')
      .insert(briefData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create brief' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Brief created successfully:', brief.id);

    // Generate audio with OpenAI TTS
    async function generateAudioOpenAI() {
      try {
        console.log('Starting OpenAI TTS generation...');
        
        // Generate script
        const sampleScripts = {
          focus: `Welcome to your focus session. Today we're exploring ${topics.join(', ')}. Let's dive deep into concentration and clarity, eliminating distractions and maximizing your cognitive potential.`,
          energy: `Get ready to energize! Today's topics include ${topics.join(', ')}. Feel the motivation building as we explore dynamic concepts that will boost your energy and drive.`,
          calm: `Take a deep breath and relax. We'll be gently exploring ${topics.join(', ')} in a soothing manner that promotes peace and tranquility.`
        };
        const script = sampleScripts[mood] || 'Welcome to your personalized briefing.';
        
        // Update status to TTS
        await supabase.from('briefs').update({ status: 'tts', script }).eq('id', brief.id);
        
        // Generate TTS with OpenAI
        console.log('Calling OpenAI TTS API...');
        const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: script,
            voice: mood === 'energy' ? 'nova' : mood === 'calm' ? 'shimmer' : 'alloy',
            response_format: 'mp3',
          }),
        });

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error('OpenAI TTS error:', errorText);
          throw new Error(`TTS failed: ${ttsResponse.status} - ${errorText}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
        const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;
        
        console.log('Audio generated successfully with OpenAI TTS');
        
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
        console.error('OpenAI TTS generation failed:', error);
        await supabase
          .from('briefs')
          .update({ 
            status: 'error', 
            error_message: error.message 
          })
          .eq('id', brief.id);
      }
    }
    
    // Start background task immediately
    generateAudioOpenAI().catch(error => console.error('Background task failed:', error));

    // Return immediate response
    return new Response(JSON.stringify({ 
      briefId: brief.id, 
      status: 'queued'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== FUNCTION ERROR ===', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});