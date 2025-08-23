import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledBrief {
  id: string;
  user_id: string;
  label: string;
  mood: string;
  duration_sec: number;
  topics: string[];
  schedule_time: string;
  timezone: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled brief generation...');

    // Get current time in various timezones to find schedules that should trigger
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Look for schedules that should trigger within the next 5 minutes
    const targetTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
    
    console.log(`Looking for schedules at time: ${targetTime}`);

    // Fetch active schedules that should trigger now
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true)
      .eq('schedule_time', targetTime)
      .is('last_generated_at', null)
      .or(`last_generated_at.lt.${new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString()}`); // Haven't generated in last 23 hours

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} schedules to process`);

    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No schedules to process',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;
    const results = [];

    // Process each schedule
    for (const schedule of schedules) {
      try {
        console.log(`Processing schedule: ${schedule.label} for user: ${schedule.user_id}`);
        
        // Generate brief content using OpenAI
        const briefContent = await generateBriefContent(schedule);
        
        // Create brief record in database
        const { data: brief, error: briefError } = await supabase
          .from('briefs')
          .insert([{
            user_id: schedule.user_id,
            script: briefContent.script,
            duration_sec: schedule.duration_sec,
            mood: schedule.mood,
            topics: schedule.topics,
            status: 'queued'
          }])
          .select()
          .single();

        if (briefError) {
          console.error('Error creating brief:', briefError);
          continue;
        }

        console.log(`Created brief: ${brief.id}`);

        // Update schedule last_generated_at
        await supabase
          .from('schedules')
          .update({ last_generated_at: now.toISOString() })
          .eq('id', schedule.id);

        // Track analytics
        await supabase
          .from('user_analytics')
          .insert([{
            user_id: schedule.user_id,
            event_type: 'auto_generated',
            brief_id: brief.id,
            context: {
              schedule_id: schedule.id,
              schedule_label: schedule.label,
              trigger_time: targetTime,
              timezone: schedule.timezone
            }
          }]);

        processedCount++;
        results.push({
          schedule_id: schedule.id,
          brief_id: brief.id,
          status: 'success'
        });

        // TODO: Send push notification or email notification
        console.log(`Successfully processed schedule: ${schedule.label}`);

      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
        results.push({
          schedule_id: schedule.id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`Processed ${processedCount} schedules successfully`);

    return new Response(JSON.stringify({
      message: `Processed ${processedCount} schedules`,
      processed: processedCount,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scheduled-brief-generator:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      processed: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateBriefContent(schedule: ScheduledBrief): Promise<{ script: string }> {
  const timeOfDay = getTimeOfDay(schedule.schedule_time);
  const moodPrompts = {
    energizing: 'upbeat, motivational, and inspiring',
    focused: 'calm, clear, and purposeful',
    calming: 'peaceful, soothing, and relaxing',
    creative: 'imaginative, flowing, and innovative',
    motivational: 'powerful, encouraging, and action-oriented'
  };

  const systemPrompt = `You are SonicBrief AI, creating personalized audio content for users. Create a ${Math.floor(schedule.duration_sec / 60)}-minute ${timeOfDay} brief that is ${moodPrompts[schedule.mood] || 'engaging and helpful'}.

Topics to include: ${schedule.topics.join(', ')}
Target mood: ${schedule.mood}
Time of day: ${timeOfDay}

Structure the brief with:
1. Gentle opening that acknowledges the time of day
2. Main content covering the requested topics
3. Practical insights or actions
4. Positive, encouraging closing

Write in a conversational, warm tone as if speaking directly to the listener. Make it personal and relevant to someone starting their ${timeOfDay}.`;

  const userPrompt = `Create a ${schedule.label} brief for ${timeOfDay}. Include relevant information about ${schedule.topics.join(', ')} with a ${schedule.mood} tone. Keep it exactly ${Math.floor(schedule.duration_sec / 60)} minutes when spoken aloud.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const script = data.choices[0].message.content;

  return { script };
}

function getTimeOfDay(time: string): string {
  const hour = parseInt(time.split(':')[0]);
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}