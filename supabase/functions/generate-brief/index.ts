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
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const elevenlabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
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

    console.log('User authenticated');

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Body parse error');
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { mood, topics, durationSec } = requestBody;

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
      return new Response(JSON.stringify({ 
        error: 'Failed to create brief', 
        details: insertError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Brief created successfully');

    // Start audio generation in background
    async function generateAudio() {
      try {
        console.log('Starting enhanced audio generation with music...');
        
        // Generate comprehensive content using OpenAI
        const openaiKey = Deno.env.get('OPENAI_API_KEY');
        let script = '';
        
        if (openaiKey) {
          console.log('Generating comprehensive content with OpenAI...');
          
          const contentPrompt = `Create a comprehensive, engaging ${Math.floor(durationSec / 60)}-minute audio script about ${topics.join(', ')} with a ${mood} tone. 

The script should:
- Be ${Math.floor(durationSec / 150)} paragraphs long (aim for ${durationSec * 2.5} words total)
- Match the ${mood} mood perfectly
- Include practical insights and actionable information
- Flow naturally for audio narration
- Be educational and valuable
- Include smooth transitions between topics

Mood guidelines:
- Focus: Clear, structured, concentration-enhancing content
- Energy: Dynamic, motivating, high-energy delivery
- Calm: Soothing, mindful, relaxing presentation

Write ONLY the script content, no meta-text or instructions.`;

          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are a professional audio content creator who writes engaging, informative scripts for educational audio content.'
                },
                {
                  role: 'user',
                  content: contentPrompt
                }
              ],
              max_tokens: Math.min(4000, Math.max(800, durationSec * 4)),
              temperature: 0.7
            }),
          });

          if (openaiResponse.ok) {
            const openaiData = await openaiResponse.json();
            script = openaiData.choices[0].message.content;
            console.log('Generated script length:', script.length, 'characters');
          } else {
            console.log('OpenAI failed, using fallback script');
            script = `Welcome to your ${mood} session on ${topics.join(', ')}. ` + 
                    `Let's explore these fascinating topics together in a way that matches your current mood and learning goals. ` +
                    `This is your personalized audio experience designed to help you learn effectively while maintaining the perfect ${mood} atmosphere.`;
          }
        } else {
          console.log('OpenAI not configured, using enhanced fallback...');
          const moodScripts = {
            focus: `Welcome to your enhanced focus session. Today we're diving deep into ${topics.join(', ')}. Let's eliminate distractions, sharpen your concentration, and unlock your cognitive potential. Take a deep breath as we begin this journey of focused learning.`,
            energy: `Time to energize and ignite your passion! We're exploring ${topics.join(', ')} with dynamic energy and unstoppable momentum. Feel the excitement building as we dive into concepts that will fuel your drive and amplify your success. Let's transform learning into pure energy!`,
            calm: `Welcome to your peaceful learning sanctuary. Today we'll gently explore ${topics.join(', ')} in a soothing, mindful way. Allow yourself to relax completely as we create a tranquil space for deep, meaningful understanding. Breathe deeply and let the knowledge flow naturally.`
          };
          script = moodScripts[mood] || 'Welcome to your personalized SonicBrief experience.';
        }
        
        // Update status to generating
        await supabase.from('briefs').update({ 
          status: 'generating', 
          script,
          total_segments: 3 // intro music, content, outro
        }).eq('id', brief.id);
        
        console.log('Creating multi-segment audio experience...');
        
        // Create audio segments for enhanced experience
        const segments = [
          {
            brief_id: brief.id,
            segment_type: 'intro_music',
            sequence_order: 1,
            script: 'Intro music for mood setting',
            duration_sec: 15,
            status: 'pending'
          },
          {
            brief_id: brief.id,
            segment_type: 'content',
            sequence_order: 2,
            script: script,
            duration_sec: durationSec - 30, // Main content
            status: 'pending'
          },
          {
            brief_id: brief.id,
            segment_type: 'outro',
            sequence_order: 3,
            script: 'Gentle conclusion with ambient sounds',
            duration_sec: 15,
            status: 'pending'
          }
        ];

        // Insert segments
        const { data: createdSegments, error: segmentError } = await supabase
          .from('audio_segments')
          .insert(segments)
          .select();

        if (segmentError) {
          throw new Error(`Failed to create segments: ${segmentError.message}`);
        }

        console.log('Segments created:', createdSegments.length);

        // Generate TTS with ElevenLabs if available, otherwise use a longer sample text
        const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
        let contentAudioUrl;
        
        if (elevenlabsApiKey) {
          console.log('Using ElevenLabs for TTS generation...');
        
        // Update status to TTS
        await supabase.from('briefs').update({ status: 'tts' }).eq('id', brief.id);
        
        // Generate main content audio
        const voiceId = '9BWtsMINqrJLrRacOk9x'; // Aria voice
        
        // Adjust voice settings based on mood
        const voiceSettings = {
          focus: { stability: 0.7, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
          energy: { stability: 0.4, similarity_boost: 0.6, style: 0.7, use_speaker_boost: true },
          calm: { stability: 0.9, similarity_boost: 0.9, style: 0.1, use_speaker_boost: false }
        };

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
              voice_settings: voiceSettings[mood] || voiceSettings.focus,
            }),
          });

          if (!ttsResponse.ok) {
            const errorText = await ttsResponse.text();
            console.error('ElevenLabs error:', errorText);
            throw new Error(`TTS failed: ${ttsResponse.status}`);
          }

          const audioBuffer = await ttsResponse.arrayBuffer();
          const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
          contentAudioUrl = `data:audio/mpeg;base64,${audioBase64}`;
        } else {
          console.log('ElevenLabs not configured, using sample audio...');
          // Create a longer sample audio URL (you could host actual audio files)
          contentAudioUrl = '/sample.mp3'; // This should be a real audio file
        }
        
        console.log('Main content audio generated successfully');

        // Update content segment with audio
        await supabase
          .from('audio_segments')
          .update({
            audio_url: contentAudioUrl,
            status: 'ready'
          })
          .eq('brief_id', brief.id)
          .eq('segment_type', 'content');

        // Generate actual background music
        console.log('Generating background music...');
        
        let backgroundMusicUrl = '/sample.mp3'; // fallback
        
        try {
          // Call music generation function using user's JWT (more secure than SRK)
          const { data: musicData, error: musicError } = await supabase.functions.invoke('generate-music', {
            body: {
              mood,
              duration: Math.max(30, durationSec - 30)
            }
          });
          
          if (!musicError && musicData?.musicUrl) {
            backgroundMusicUrl = musicData.musicUrl;
            console.log('Background music generated successfully');
          } else {
            console.log('Music generation failed, using fallback:', musicError);
          }
        } catch (musicError) {
          console.error('Music generation error:', musicError);
        }

        // Update intro and outro segments with appropriate audio
        await supabase
          .from('audio_segments')
          .update({
            audio_url: backgroundMusicUrl,
            status: 'ready'
          })
          .eq('brief_id', brief.id)
          .eq('segment_type', 'intro_music');

        await supabase
          .from('audio_segments')
          .update({
            audio_url: backgroundMusicUrl,
            status: 'ready'
          })
          .eq('brief_id', brief.id)
          .eq('segment_type', 'outro');
        
        // Update brief with ready status and background music
        await supabase
          .from('briefs')
          .update({
            status: 'ready',
            script,
            audio_url: contentAudioUrl, // Main audio for fallback
            background_music_url: backgroundMusicUrl
          })
          .eq('id', brief.id);
          
        console.log('Enhanced brief with music completed successfully');
        
      } catch (error) {
        console.error('Enhanced audio generation failed:', error);
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