import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateBriefRequest {
  mood: 'focus' | 'energy' | 'calm';
  topics?: string[]; // Legacy support
  instructions?: string; // New preferred field
  durationSec: number;
}

// Generate script and compose audio
async function generateAudioOpenAI(briefId: string, mood: string, userPrompt: string, durationSec: number, openaiKey: string, supabaseUrl: string, supabaseAnonKey: string, authHeader: string) {
  try {
    console.log('Starting content generation for brief:', briefId, 'Duration:', durationSec);
    
    // Create a new Supabase client for background task
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    
    // Generate detailed script using OpenAI based on duration
    const wordsPerMinute = 150; // Average speaking rate
    const targetWords = Math.floor((durationSec / 60) * wordsPerMinute);
    
    console.log('Generating script with OpenAI for', targetWords, 'words');
    
    // Update status to summarizing
    await supabase.from('briefs').update({ status: 'summarizing' }).eq('id', briefId);
    
    // Generate experiential audio script with OpenAI
    const scriptPrompt = `Create an immersive, experiential ${durationSec}-second (approximately ${targetWords} words) audio experience based on: "${userPrompt}" in a ${mood} style.

CRITICAL: This is NOT educational content. The user wants to EXPERIENCE ${mood}, not learn ABOUT ${mood}.

For ${mood} mood:
${mood === 'focus' ? '- Guide them into sharp mental clarity: "Notice your mind becoming crystal clear..."\n- Use present-tense affirmations: "You are focused. Each thought becomes precise..."\n- Create sensory awareness of concentration' : ''}
${mood === 'energy' ? '- Build dynamic momentum: "Feel energy rising through your body..."\n- Use power affirmations: "You are unstoppable. Your strength grows..."\n- Create vibrant, activating sensory experiences' : ''}
${mood === 'calm' ? '- Create deep relaxation: "With each breath, tension melts away..."\n- Use soothing affirmations: "You are at peace. Everything flows effortlessly..."\n- Build serene, peaceful sensory awareness' : ''}

Style Guidelines:
- Speak directly to the listener (second person: "you")
- Use present tense and present-moment awareness
- Include guided breathing or body awareness
- Be hypnotic, immersive, meditation-like
- NO facts, NO education, NO explanations about how things work
- Pure experiential guidance into the desired state

Make this exactly ${targetWords} words to fill the ${durationSec}-second duration. Return only the immersive script text, no formatting.`;

    const scriptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a SonicBrief audio experience creator. Create immersive, experiential guided audio that induces the desired mental state. Never create educational content - only direct, present-moment experiences.'
          },
          {
            role: 'user',
            content: scriptPrompt
          }
        ],
        max_tokens: Math.min(4000, targetWords * 2), // Allow for detailed response
        temperature: 0.7,
      }),
    });

    let script = '';
    if (scriptResponse.ok) {
      const scriptData = await scriptResponse.json();
      script = scriptData.choices[0]?.message?.content || '';
      console.log('Generated script length:', script.length, 'characters');
    } else {
      console.log('OpenAI script generation failed, using fallback');
      // Fallback script
      script = `Welcome to your ${mood} experience. ` +
        `Take a deep breath and let yourself fully immerse in this moment. ` +
        `Feel the energy shifting as you focus on ${userPrompt}. ` +
        `This is your time to grow, to focus, to become more aligned with your goals. ` +
        `Each moment brings you closer to clarity and understanding.`;
    }
    
    // Update status to TTS
    await supabase.from('briefs').update({ status: 'tts', script }).eq('id', briefId);
    
    // Call the composer to generate audio (TTS + loops + binaural)
    console.log('Calling composer to generate audio...');
    
    try {
      const composerResponse = await fetch(`${supabaseUrl}/functions/v1/composer`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ briefId }),
      });

      if (!composerResponse.ok) {
        const errorText = await composerResponse.text();
        console.error('Composer error:', errorText);
        throw new Error(`Composer failed: ${composerResponse.status}`);
      }

      const composerData = await composerResponse.json();
      console.log('Composer completed:', composerData);

    } catch (error) {
      console.error('Composer failed:', error);
      await supabase
        .from('briefs')
        .update({
          status: 'error',
          error_message: `Audio composition failed: ${error.message}`,
          script
        })
        .eq('id', briefId);
      throw error;
    }
      
    console.log('Brief completed successfully');
    
  } catch (error) {
    console.error('OpenAI TTS generation failed:', error);
    
    // Create a new Supabase client for error handling
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    
    await supabase
      .from('briefs')
      .update({ 
        status: 'error', 
        error_message: error.message 
      })
      .eq('id', briefId);
  }
}

serve(async (req) => {
  const startTime = Date.now();
  console.log('=== OPENAI TTS FUNCTION START ===', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== PROCESSING MAIN REQUEST ===');
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('Environment check:');
    console.log('- SUPABASE_URL present:', !!supabaseUrl);
    console.log('- SUPABASE_ANON_KEY present:', !!supabaseAnonKey);
    console.log('- OPENAI_API_KEY present:', !!openaiKey);
    
    if (!supabaseUrl || !supabaseAnonKey || !openaiKey) {
      console.error('Missing required environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey,
        openaiKey: !!openaiKey
      });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    if (!authHeader) {
      console.error('No authorization header provided');
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
    console.log('Verifying user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('User authenticated successfully:', user.id);

    // Parse request body
    console.log('Parsing request body...');
    const requestBody = await req.json();
    const { mood, topics, instructions, durationSec } = requestBody;
    
    // Support both old topics array format and new instructions string
    const userPrompt = instructions || (topics && topics.length > 0 ? topics.join(', ') : '');
    
    console.log('Request parameters:', { mood, userPrompt: userPrompt.slice(0, 100), durationSec });
    
    if (!userPrompt) {
      return new Response(JSON.stringify({ error: 'Either instructions or topics is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert brief into database
    const briefData = {
      user_id: user.id,
      mood,
      topics: instructions ? [instructions] : topics, // Store instructions as single-item array for compatibility
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
    
    // Start background task using EdgeRuntime.waitUntil for proper execution
    const backgroundTask = generateAudioOpenAI(
      brief.id, 
      mood, 
      userPrompt, 
      durationSec, 
      openaiKey,
      supabaseUrl, 
      supabaseAnonKey, 
      authHeader
    );
    
    EdgeRuntime.waitUntil(backgroundTask.catch(error => {
      console.error('Background task failed:', error);
      // Update brief status to error in database
      const errorSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader } },
      });
      errorSupabase.from('briefs')
        .update({ status: 'error', error_message: error.message })
        .eq('id', brief.id)
        .then(() => console.log('Brief status updated to error'));
    }));

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