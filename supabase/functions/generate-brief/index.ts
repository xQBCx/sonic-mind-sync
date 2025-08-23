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

    // For MVP, immediately mark as ready with sample audio
    // In production, this would be where you'd call OpenAI, MusicGen, etc.
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate sample script based on mood and topics
    const sampleScripts = {
      focus: `Welcome to your focus session. Today we're exploring ${topics.join(', ')}. Let's dive deep into concentration and clarity, eliminating distractions and maximizing your cognitive potential.`,
      energy: `Get ready to energize! Today's topics include ${topics.join(', ')}. Feel the motivation building as we explore dynamic concepts that will boost your energy and drive.`,
      calm: `Take a deep breath and relax. We'll be gently exploring ${topics.join(', ')} in a soothing manner that promotes peace and tranquility.`
    };

    const script = sampleScripts[mood] || 'Welcome to your personalized briefing.';

    // Update brief with ready status and sample content
    const { error: updateError } = await supabaseUser
      .from('briefs')
      .update({
        status: 'ready',
        script,
        audio_url: '/sample.mp3', // Using public sample audio for MVP
      })
      .eq('id', brief.id);

    if (updateError) {
      console.error('Failed to update brief:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update brief' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Brief completed successfully:', brief.id);

    return new Response(JSON.stringify({ 
      briefId: brief.id, 
      status: 'ready' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-brief function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});