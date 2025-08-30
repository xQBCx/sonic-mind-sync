import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== REALTIME CHAT WEBSOCKET START ===');
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !openaiKey) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upgrade to WebSocket
    const upgrade = req.headers.get('upgrade') || '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return new Response('Expected websocket upgrade', { status: 426 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let openaiWs: WebSocket | null = null;
    let sessionCreated = false;
    let authenticated = false;
    let supabase: any = null;

    // Function to create audio brief from conversation
    const createAudioBrief = async (briefRequest: any) => {
      try {
        console.log('Creating audio brief from conversation:', briefRequest);
        
        // Call the existing generate-brief function
        const { data, error } = await supabase.functions.invoke('generate-brief', {
          body: briefRequest
        });
        
        if (error) {
          console.error('Error creating brief:', error);
          return { error: error.message };
        }
        
        console.log('Brief created successfully:', data);
        return data;
      } catch (error) {
        console.error('Error in createAudioBrief:', error);
        return { error: error.message };
      }
    };

    socket.onopen = () => {
      console.log('Client WebSocket connected');
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle authentication
        if (data.type === 'auth') {
          console.log('Authenticating client...');
          
          // Initialize Supabase with the provided token
          supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: { Authorization: `Bearer ${data.token}` },
            },
          });

          // Verify user authentication
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
            console.error('Authentication failed:', authError);
            socket.send(JSON.stringify({ 
              type: 'error', 
              message: 'Authentication failed' 
            }));
            socket.close();
            return;
          }

          console.log('User authenticated');
          authenticated = true;
          
          // Now connect to OpenAI
          const openaiUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
          openaiWs = new WebSocket(openaiUrl);
          
          // Send authorization after connection
          openaiWs.onopen = () => {
            console.log('Connected to OpenAI Realtime API');
            // Send authorization
            openaiWs?.send(JSON.stringify({
              type: 'session.update',
              session: {
                authorization: `Bearer ${openaiKey}`
              }
            }));
            socket.send(JSON.stringify({ type: 'connected' }));
          };
          

          openaiWs.onmessage = async (event) => {
            // ... rest of OpenAI message handling
            try {
              const data = JSON.parse(event.data);
              
              // Handle session creation
              if (data.type === 'session.created' && !sessionCreated) {
                console.log('Session created, sending session update...');
                sessionCreated = true;
                
                // Send session configuration
                const sessionUpdate = {
                  type: 'session.update',
                  session: {
                    modalities: ['text', 'audio'],
                    instructions: `You are SonicBrief, an AI audio content creator. Your job is to understand what the user wants and create personalized audio experiences for them.

IMPORTANT: When a user describes what they want (learning topics, mood, music style, emotional state), you should:

1. LISTEN carefully to understand their:
   - Current emotional state (stressed, excited, sad, motivated, etc.)
   - Learning goals (python, meditation, business advice, etc.) 
   - Preferred music/audio style (heavy metal, dubstep, calming, nature sounds, etc.)
   - Specific needs (Tony Robbins advice, calming down, motivation for running, etc.)

2. When you have enough information, use the create_audio_brief tool to generate their custom audio content.

3. Be conversational and empathetic. Ask clarifying questions if needed.

Examples of user requests:
- "I'm stressed about work and want to learn meditation with calming sounds"
- "I want to learn Python while listening to heavy metal beats"  
- "I'm depressed and want motivation for running with dubstep and learn about birds"
- "What would Tony Robbins say about my business situation? I need to calm down"

Your goal is to create the perfect audio experience for their current state and needs.`,
                    voice: 'alloy',
                    input_audio_format: 'pcm16',
                    output_audio_format: 'pcm16',
                    input_audio_transcription: {
                      model: 'whisper-1'
                    },
                    turn_detection: {
                      type: 'server_vad',
                      threshold: 0.5,
                      prefix_padding_ms: 300,
                      silence_duration_ms: 1000
                    },
                    tools: [
                      {
                        type: 'function',
                        name: 'create_audio_brief',
                        description: 'Create a personalized audio brief based on user preferences, mood, and learning goals',
                        parameters: {
                          type: 'object',
                          properties: {
                            topics: {
                              type: 'array',
                              items: { type: 'string' },
                              description: 'Topics the user wants to learn about'
                            },
                            mood: {
                              type: 'string',
                              description: 'The mood/tone for the content (energetic, calming, motivational, etc.)'
                            },
                            duration_sec: {
                              type: 'integer',
                              description: 'Duration in seconds (default 300 for 5 minutes)'
                            },
                            music_style: {
                              type: 'string',
                              description: 'Preferred music or audio style (heavy metal, dubstep, nature sounds, calming, etc.)'
                            },
                            emotional_state: {
                              type: 'string',
                              description: 'User\'s current emotional state (stressed, excited, sad, motivated, etc.)'
                            },
                            specific_request: {
                              type: 'string',
                              description: 'Any specific requests like "Tony Robbins advice" or "motivation for running"'
                            }
                          },
                          required: ['topics', 'mood']
                        }
                      }
                    ],
                    tool_choice: 'auto',
                    temperature: 0.8,
                    max_response_output_tokens: 'inf'
                  }
                };
                
                openaiWs?.send(JSON.stringify(sessionUpdate));
              }
              
              // Handle function calls
              if (data.type === 'response.function_call_arguments.done') {
                console.log('Function call completed:', data);
                
                if (data.name === 'create_audio_brief') {
                  try {
                    const args = JSON.parse(data.arguments);
                    
                    // Transform the arguments to match our API
                    const briefRequest = {
                      topics: args.topics || [],
                      mood: args.mood || 'informative',
                      durationSec: args.duration_sec || 300
                    };
                    
                    // Create the audio brief
                    const result = await createAudioBrief(briefRequest);
                    
                    // Send result back to OpenAI
                    const responseEvent = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: data.call_id,
                        output: JSON.stringify(result)
                      }
                    };
                    
                    openaiWs?.send(JSON.stringify(responseEvent));
                    openaiWs?.send(JSON.stringify({ type: 'response.create' }));
                    
                    // Also send to client for UI updates
                    socket.send(JSON.stringify({
                      type: 'brief_created',
                      data: result
                    }));
                    
                  } catch (error) {
                    console.error('Error processing function call:', error);
                  }
                }
              }
              
              // Forward all other messages to client
              socket.send(event.data);
              
            } catch (error) {
              console.error('Error processing OpenAI message:', error);
            }
          };

          openaiWs.onerror = (error) => {
            console.error('OpenAI WebSocket error:', error);
            socket.send(JSON.stringify({ type: 'error', message: 'Connection error' }));
          };

          openaiWs.onclose = () => {
            console.log('OpenAI WebSocket closed');
            socket.close();
          };
          
          return;
        }

        // Forward client messages to OpenAI (only if authenticated)
        if (authenticated && openaiWs && openaiWs.readyState === WebSocket.OPEN) {
          console.log('Forwarding message to OpenAI');
          openaiWs.send(event.data);
        } else if (!authenticated) {
          console.log('Client not authenticated, ignoring message');
        }
      } catch (error) {
        console.error('Error processing client message:', error);
      }
    };

    socket.onclose = () => {
      console.log('Client WebSocket closed');
      if (openaiWs) {
        openaiWs.close();
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (openaiWs) {
        openaiWs.close();
      }
    };

    return response;

  } catch (error) {
    console.error('Error in realtime-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred in realtime chat',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});