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

    // Submit music generation task to CometAPI
    console.log('Submitting music generation task to CometAPI...');
    const submitResponse = await fetch('https://api.cometapi.com/suno/submit/music', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cometApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        mv: 'chirp-auk', // Suno v4.5
        instrumental: true, // For background music
        tags: 'instrumental background music'
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('CometAPI submit error:', errorText);
      throw new Error(`CometAPI submit failed: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    console.log('CometAPI submit response:', submitData);

    // Check if the response contains a task ID
    const taskId = submitData.data || submitData.task_id || submitData.id;
    if (!taskId) {
      console.error('No task ID in submit response:', submitData);
      throw new Error('No task ID returned from CometAPI');
    }

    console.log('Task submitted successfully, ID:', taskId);
    console.log('Polling for completion...');

    // Poll for task completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let musicUrl = null;

    while (attempts < maxAttempts) {
      attempts++;
      
      // Wait 5 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`Polling attempt ${attempts}/${maxAttempts} for task: ${taskId}`);
      
      try {
        const pollResponse = await fetch(`https://api.cometapi.com/task/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cometApiKey}`,
          },
        });

        if (!pollResponse.ok) {
          console.error(`Poll attempt ${attempts} failed with status:`, pollResponse.status);
          continue;
        }

        const pollData = await pollResponse.json();
        console.log(`Poll response ${attempts}:`, JSON.stringify(pollData));

        // Check if task is completed
        if (pollData.status === 'completed' || pollData.state === 'completed') {
          // Look for audio URL in various possible locations
          musicUrl = pollData.data?.audio_url || 
                    pollData.data?.output_url || 
                    pollData.data?.url ||
                    pollData.audio_url || 
                    pollData.output_url || 
                    pollData.url;
          
          if (musicUrl) {
            console.log('Music generation completed successfully, URL:', musicUrl);
            break;
          } else {
            console.log('Task completed but no audio URL found in:', pollData);
          }
        } else if (pollData.status === 'failed' || pollData.state === 'failed') {
          console.error('Music generation task failed:', pollData);
          throw new Error('Music generation failed');
        } else {
          console.log(`Task status: ${pollData.status || pollData.state || 'unknown'}`);
        }
      } catch (pollError) {
        console.error(`Poll attempt ${attempts} error:`, pollError);
      }
    }

    if (!musicUrl) {
      throw new Error(`Music generation timed out after ${maxAttempts} attempts`);
    }
    
    return new Response(JSON.stringify({ 
      musicUrl,
      duration,
      mood,
      status: 'ready',
      metadata: {
        cometId: taskId,
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