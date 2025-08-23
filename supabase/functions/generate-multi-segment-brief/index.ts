import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateSegmentBriefRequest {
  mood: 'focus' | 'energy' | 'calm';
  topics: string[];
  durationSec: number;
  flowType: 'single' | 'morning' | 'midday' | 'study' | 'winddown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== MULTI-SEGMENT BRIEF GENERATION START ===');
    
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
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { mood, topics, durationSec, flowType } = await req.json();
    console.log('Parsed request:', { mood, topics, durationSec, flowType });

    if (!mood || !topics || !durationSec || !flowType) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Define segment structures for different flow types
    const flowStructures = {
      single: [
        { type: 'content', duration: durationSec }
      ],
      morning: [
        { type: 'intro_music', duration: 15 },
        { type: 'affirmation', duration: 30 },
        { type: 'content', duration: durationSec - 60 },
        { type: 'outro', duration: 15 }
      ],
      midday: [
        { type: 'intro_music', duration: 10 },
        { type: 'affirmation', duration: 20 },
        { type: 'content', duration: durationSec - 45 },
        { type: 'outro', duration: 15 }
      ],
      study: [
        { type: 'ambient', duration: 30 },
        { type: 'content', duration: durationSec - 45 },
        { type: 'outro', duration: 15 }
      ],
      winddown: [
        { type: 'intro_music', duration: 20 },
        { type: 'affirmation', duration: 40 },
        { type: 'content', duration: durationSec - 80 },
        { type: 'outro', duration: 20 }
      ]
    };

    const segmentStructure = flowStructures[flowType] || flowStructures.single;

    // Insert main brief record
    const briefData = {
      user_id: user.id,
      mood,
      topics,
      duration_sec: durationSec,
      flow_type: flowType,
      total_segments: segmentStructure.length,
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

    console.log('Brief created:', brief.id);

    // Generate segment scripts based on flow type and mood
    const generateSegmentScript = (segmentType: string, order: number) => {
      const scriptTemplates = {
        intro_music: {
          focus: "Welcome to your focus session. Let's begin with some calming sounds to center your mind.",
          energy: "Good morning! Time to energize and power up for an amazing day ahead.",
          calm: "Take a deep breath and let yourself settle into this peaceful moment."
        },
        affirmation: {
          focus: `You are capable of deep concentration. Today you'll explore ${topics.join(', ')} with clarity and purpose. Your mind is sharp and ready.`,
          energy: `You have unlimited energy and enthusiasm. ${topics.join(', ')} will inspire and motivate you today. You're unstoppable!`,
          calm: `You are at peace. Learning about ${topics.join(', ')} brings you joy and tranquility. You move through your day with grace.`
        },
        content: {
          focus: `Now let's dive deep into ${topics.join(', ')}. Focus your attention completely as we explore these concepts with precision and depth.`,
          energy: `Get excited about ${topics.join(', ')}! These dynamic ideas will fuel your passion and drive your success forward.`,
          calm: `Gently exploring ${topics.join(', ')} in a relaxed and mindful way. Let these concepts flow through your awareness naturally.`
        },
        outro: {
          focus: "You've completed your focus session successfully. Carry this clarity and concentration into the rest of your day.",
          energy: "You're now fully energized and ready to take on any challenge. Go make it an amazing day!",
          calm: "Take this sense of peace and calm with you. You're centered and ready for whatever comes next."
        },
        ambient: {
          focus: "Let the gentle sounds create the perfect atmosphere for deep learning and concentration.",
          energy: "Feel the energy building as these sounds prepare your mind for peak performance.",
          calm: "Allow these peaceful tones to wash over you, creating perfect harmony for learning."
        }
      };

      return scriptTemplates[segmentType]?.[mood] || "Welcome to your personalized audio experience.";
    };

    // Start background generation process
    async function generateSegments() {
      try {
        console.log('Starting segment generation...');
        await supabase.from('briefs').update({ status: 'summarizing' }).eq('id', brief.id);

        // Create audio segments
        const segmentPromises = segmentStructure.map(async (segmentDef, index) => {
          const segmentData = {
            brief_id: brief.id,
            segment_type: segmentDef.type,
            sequence_order: index,
            script: generateSegmentScript(segmentDef.type, index),
            duration_sec: segmentDef.duration,
            status: 'pending'
          };

          const { data: segment } = await supabase
            .from('audio_segments')
            .insert(segmentData)
            .select()
            .single();

          return segment;
        });

        const segments = await Promise.all(segmentPromises);
        console.log(`Created ${segments.length} segments`);

        // Generate audio for each segment
        await supabase.from('briefs').update({ status: 'tts' }).eq('id', brief.id);

        if (elevenlabsKey) {
          for (const segment of segments) {
            if (!segment || segment.segment_type === 'intro_music' || segment.segment_type === 'ambient') {
              // Skip music segments for now (would use different API)
              continue;
            }

            try {
              await supabase
                .from('audio_segments')
                .update({ status: 'generating' })
                .eq('id', segment.id);

              const voiceId = '9BWtsMINqrJLrRacOk9x'; // Aria voice
              const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                  'Accept': 'audio/mpeg',
                  'Content-Type': 'application/json',
                  'xi-api-key': elevenlabsKey,
                },
                body: JSON.stringify({
                  text: segment.script,
                  model_id: 'eleven_multilingual_v2',
                  voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                  },
                }),
              });

              if (ttsResponse.ok) {
                const audioBuffer = await ttsResponse.arrayBuffer();
                const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
                const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

                await supabase
                  .from('audio_segments')
                  .update({ 
                    audio_url: audioDataUrl, 
                    status: 'ready' 
                  })
                  .eq('id', segment.id);

                console.log(`Generated audio for segment ${segment.sequence_order}`);
              } else {
                throw new Error(`TTS failed for segment ${segment.id}`);
              }
            } catch (error) {
              console.error(`Error generating segment ${segment.id}:`, error);
              await supabase
                .from('audio_segments')
                .update({ status: 'error' })
                .eq('id', segment.id);
            }
          }
        }

        // Update brief status to ready
        await supabase
          .from('briefs')
          .update({ 
            status: 'ready',
            segments: segments.map(s => ({ id: s.id, type: s.segment_type, order: s.sequence_order }))
          })
          .eq('id', brief.id);

        console.log('Multi-segment brief generation completed');

      } catch (error) {
        console.error('Segment generation failed:', error);
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
      EdgeRuntime.waitUntil(generateSegments());
    } else {
      generateSegments().catch(console.error);
    }

    // Return immediate response
    console.log('=== MULTI-SEGMENT BRIEF QUEUED ===');
    return new Response(JSON.stringify({ 
      briefId: brief.id, 
      status: 'queued',
      flowType,
      totalSegments: segmentStructure.length
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