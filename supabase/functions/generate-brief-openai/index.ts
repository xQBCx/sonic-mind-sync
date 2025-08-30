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

// Generate audio with OpenAI TTS
async function generateAudioOpenAI(briefId: string, mood: string, topics: string[], durationSec: number, openaiKey: string, supabaseUrl: string, supabaseAnonKey: string, authHeader: string) {
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
    
    // Generate comprehensive script with OpenAI
    const scriptPrompt = `Create a ${durationSec}-second (approximately ${targetWords} words) detailed, informative briefing about "${topics.join(', ')}" in a ${mood} style.

For ${mood} mood:
${mood === 'focus' ? '- Use clear, structured information that enhances concentration\n- Include specific facts, data, and actionable insights\n- Maintain a steady, professional tone' : ''}
${mood === 'energy' ? '- Use dynamic, motivating language\n- Include exciting developments and positive outcomes\n- Build momentum throughout the briefing' : ''}
${mood === 'calm' ? '- Use soothing, peaceful language\n- Present information in a gentle, reassuring manner\n- Focus on hope, understanding, and balanced perspectives' : ''}

Structure:
1. Brief introduction (10% of content)
2. Main content with key points and details (75% of content)
3. Thoughtful conclusion with takeaways (15% of content)

Make this exactly ${targetWords} words to fill the ${durationSec}-second duration. Do not include any formatting, just the script text.`;

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
            content: 'You are an expert briefing writer. Create detailed, engaging content that matches the exact word count requested.'
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
      script = `Welcome to your ${mood} briefing about ${topics.join(', ')}. ` +
        `This topic is important and deserves our attention. Let's explore the key aspects, ` +
        `understand the implications, and consider the broader context. ` +
        `${topics.map(topic => `Regarding ${topic}, there are several important considerations to keep in mind.`).join(' ')} ` +
        `These developments continue to evolve and impact various aspects of our world. ` +
        `By staying informed and maintaining a ${mood} approach, we can better understand these complex issues. ` +
        `Thank you for taking the time to stay informed about these important topics.`;
    }
    
    // Update status to TTS
    await supabase.from('briefs').update({ status: 'tts', script }).eq('id', briefId);
    
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
    
    // Convert ArrayBuffer to base64 efficiently to avoid stack overflow
    const uint8Array = new Uint8Array(audioBuffer);
    let binaryString = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const audioBase64 = btoa(binaryString);
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;
    
    console.log('Audio generated successfully with OpenAI TTS');
    
    // Generate background music
    console.log('Generating background music with CometAPI...');
    try {
      const musicResponse = await fetch(`${supabaseUrl}/functions/v1/generate-music`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood,
          duration: durationSec
        }),
      });
      
      let backgroundMusicUrl = null;
      if (musicResponse.ok) {
        const musicData = await musicResponse.json();
        backgroundMusicUrl = musicData.musicUrl;
        console.log('Background music generated successfully');
      } else {
        console.error('Music generation failed:', await musicResponse.text());
      }
      
      // Update brief with ready status and music
      await supabase
        .from('briefs')
        .update({
          status: 'ready',
          script,
          audio_url: audioDataUrl,
          background_music_url: backgroundMusicUrl,
          duration_sec: durationSec
        })
        .eq('id', briefId);
        
    } catch (musicError) {
      console.error('Music generation error:', musicError);
      // Still mark as ready but without music
      await supabase
        .from('briefs')
        .update({
          status: 'ready',
          script,
          audio_url: audioDataUrl,
          duration_sec: durationSec
        })
        .eq('id', briefId);
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
    
    // Start background task using setTimeout to avoid blocking
    setTimeout(() => {
      generateAudioOpenAI(brief.id, mood, topics, durationSec, openaiKey, supabaseUrl, supabaseAnonKey, authHeader)
        .catch(error => console.error('Background task failed:', error));
    }, 0);

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