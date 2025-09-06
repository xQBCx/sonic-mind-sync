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
async function generateAudioOpenAI(briefId: string, mood: string, topics: string[], durationSec: number, openaiKey: string, cometApiKey: string, supabaseUrl: string, supabaseAnonKey: string, authHeader: string) {
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
    
    // Generate audio with voice + music using Suno via CometAPI
    console.log('Generating audio with voice and music using Suno via CometAPI...');
    
    const cometApiKey = Deno.env.get('COMET_API_KEY');
    if (!cometApiKey) {
      throw new Error('CometAPI key not configured');
    }

    // Create mood-specific prompts for Suno to sing the content as a song
    const moodPrompts = {
      focus: `Create a focused, educational song with clear vocals singing about: ${script}. Style: Folk-acoustic with soft guitar and light percussion, educational documentary style.`,
      energy: `Create an energetic, upbeat song with strong vocals singing about: ${script}. Style: Pop-rock with driving beat and inspiring melody, motivational and engaging.`,
      calm: `Create a peaceful, meditative song with gentle vocals singing about: ${script}. Style: Ambient-folk with soft piano, nature sounds, and soothing harmonies.`
    };

    const sunoPrompt = moodPrompts[mood] || moodPrompts.focus;

    try {
      // Submit task to CometAPI for Suno generation
      const submitResponse = await fetch('https://api.cometapi.com/suno/submit/music', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cometApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: sunoPrompt,
          mv: 'chirp-auk', // Suno v4.5
          instrumental: false, // We want vocals + music
          tags: `educational ${mood} song vocal melody music`
        }),
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('CometAPI submit error:', errorText);
        throw new Error(`CometAPI submit failed: ${submitResponse.status}`);
      }

      const submitData = await submitResponse.json();
      console.log('CometAPI submit response:', submitData);

      const taskId = submitData.data || submitData.task_id || submitData.id;
      if (!taskId) {
        throw new Error('No task ID returned from CometAPI');
      }

      console.log('Task submitted successfully, ID:', taskId);
      console.log('Polling for completion...');

      // Poll for completion with background processing
      async function pollAndUpdate() {
        let attempts = 0;
        const maxAttempts = 36; // 3 minutes max (5 second intervals)
        let audioUrl = null;
        
        while (attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          console.log(`Polling attempt ${attempts}/${maxAttempts} for task: ${taskId}`);
          
          try {
            const pollResponse = await fetch(`https://api.cometapi.com/suno/fetch/${taskId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${cometApiKey}`,
              },
            });

            if (pollResponse.ok) {
              const pollData = await pollResponse.json();
              console.log(`Poll response ${attempts}:`, JSON.stringify(pollData, null, 2));

              // Check if any individual songs are ready
              if (pollData.data && Array.isArray(pollData.data)) {
                for (const song of pollData.data) {
                  console.log('Checking song status:', song.status, 'state:', song.state, 'has audio_url:', !!song.audio_url);
                  
                  // Accept streaming songs with audio URLs as ready
                  if (song.audio_url && (
                    song.state === 'complete' || 
                    song.status === 'complete' || 
                    song.status === 'streaming'
                  )) {
                    audioUrl = song.audio_url;
                    console.log('Found ready audio URL:', audioUrl);
                    
                    // Update database immediately when we find a ready URL
                    console.log('Updating database immediately with audio URL...');
                    const { error: immediateUpdateError } = await supabase
                      .from('briefs')
                      .update({
                        status: 'ready',
                        script,
                        audio_url: audioUrl,
                        duration_sec: durationSec
                      })
                      .eq('id', briefId);
                    
                    if (immediateUpdateError) {
                      console.error('Immediate database update error:', immediateUpdateError);
                    } else {
                      console.log('Brief updated successfully with audio URL');
                      return; // Exit the polling function
                    }
                    break;
                  }
                }
                
                if (audioUrl) {
                  console.log('Audio generation completed, updating database...');
                  
                  // Update the database
                  const { error: updateError } = await supabase
                    .from('briefs')
                    .update({
                      status: 'ready',
                      script,
                      audio_url: audioUrl,
                      duration_sec: durationSec
                    })
                    .eq('id', briefId);
                  
                  if (updateError) {
                    console.error('Database update error:', updateError);
                    throw updateError;
                  }
                  
                  console.log('Brief updated successfully with audio URL');
                  return;
                }
              }
              
              // Check if task failed
              if (pollData.status === 'failed' || pollData.state === 'failed') {
                throw new Error('Suno generation failed');
              }
              
            } else {
              console.error(`Poll attempt ${attempts} failed with status:`, pollResponse.status);
            }
          } catch (pollError) {
            console.error(`Poll attempt ${attempts} error:`, pollError);
          }
        }

        // If we get here, it timed out
        console.error('Audio generation timed out');
        await supabase
          .from('briefs')
          .update({
            status: 'error',
            error_message: 'Audio generation timed out',
            script
          })
          .eq('id', briefId);
      }

      // Use background task to avoid function timeout
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(pollAndUpdate());
      } else {
        // Fallback for environments without EdgeRuntime
        setTimeout(() => {
          pollAndUpdate().catch(error => {
            console.error('Background polling failed:', error);
          });
        }, 0);
      }

    } catch (error) {
      console.error('Suno generation failed:', error);
      // Fallback to simple status update
      await supabase
        .from('briefs')
        .update({
          status: 'error',
          error_message: `Audio generation failed: ${error.message}`,
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
    const cometApiKey = Deno.env.get('COMET_API_KEY');
    
    
    console.log('Environment check:');
    console.log('- SUPABASE_URL present:', !!supabaseUrl);
    console.log('- SUPABASE_ANON_KEY present:', !!supabaseAnonKey);
    console.log('- OPENAI_API_KEY present:', !!openaiKey);
    console.log('- COMET_API_KEY present:', !!cometApiKey);
    
    
    if (!supabaseUrl || !supabaseAnonKey || !openaiKey || !cometApiKey) {
      console.error('Missing required environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey,
        openaiKey: !!openaiKey,
        cometApiKey: !!cometApiKey
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
    const { mood, topics, durationSec } = requestBody;
    console.log('Request parameters:', { mood, topics, durationSec });

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
    
    // Start background task using EdgeRuntime.waitUntil for proper execution
    const backgroundTask = generateAudioOpenAI(
      brief.id, 
      mood, 
      topics, 
      durationSec, 
      openaiKey, 
      cometApiKey,
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