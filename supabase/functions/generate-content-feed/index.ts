import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateContentFeedRequest {
  topics: string[];
  feedType: 'news' | 'market' | 'technology' | 'general';
  mood: string;
  maxItems?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CONTENT FEED GENERATION START ===');
    
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

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated');

    // Parse request body
    const { topics, feedType, mood, maxItems = 5 }: GenerateContentFeedRequest = await req.json();

    // Validate input
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return new Response(JSON.stringify({ error: 'Topics are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate content using OpenAI
    const systemPrompt = `You are an expert content curator and journalist specializing in ${feedType} content. Your task is to generate a curated feed of current, relevant content items based on the user's interests.

Create ${maxItems} content items that would be typical of what someone might find in a ${feedType} feed today. Each item should be realistic, informative, and match the ${mood} tone.

For each content item, provide:
1. A compelling headline
2. A brief summary (2-3 sentences)
3. Key takeaways or insights
4. Why this matters to someone interested in ${topics.join(', ')}

Focus on creating content that feels current and relevant, even though you may not have access to real-time data. Use your knowledge to create plausible, high-quality content that would be valuable for briefing purposes.

Return the response as a JSON array of objects with this structure:
{
  "headline": "string",
  "summary": "string", 
  "keyTakeaways": ["string", "string"],
  "relevance": "string"
}`;

    const userPrompt = `Generate a ${feedType} content feed with ${maxItems} items for someone interested in: ${topics.join(', ')}. 

The content should have a ${mood} tone and be suitable for an audio briefing. Focus on the most important and relevant information that would be valuable to know.

Topics of interest: ${topics.join(', ')}
Feed type: ${feedType}
Mood/Tone: ${mood}
Number of items: ${maxItems}`;

    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    let contentFeed;
    try {
      const parsedContent = JSON.parse(generatedContent);
      // Handle both array format and object with array property
      contentFeed = Array.isArray(parsedContent) ? parsedContent : parsedContent.items || parsedContent.feed || [];
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from AI');
    }

    // Validate content structure
    if (!Array.isArray(contentFeed) || contentFeed.length === 0) {
      throw new Error('No content items generated');
    }

    // Log successful generation
    console.log(`Generated ${contentFeed.length} content items`);

    return new Response(JSON.stringify({ 
      success: true,
      feedType,
      topics,
      mood,
      itemCount: contentFeed.length,
      content: contentFeed,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-content-feed function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while generating content feed',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});