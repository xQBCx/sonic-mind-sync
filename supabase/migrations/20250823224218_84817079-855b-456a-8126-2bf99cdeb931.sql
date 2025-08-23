-- Add user preference tracking and analytics for personalized learning

-- Create user_learning_preferences table
CREATE TABLE IF NOT EXISTS public.user_learning_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_mood TEXT,
  preferred_duration_sec INTEGER DEFAULT 300,
  favorite_topics TEXT[],
  music_preferences JSONB DEFAULT '{}',
  learning_style TEXT,
  time_of_day_preference TEXT,
  difficulty_preference TEXT DEFAULT 'intermediate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_interaction_logs table for tracking behavior
CREATE TABLE IF NOT EXISTS public.user_interaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'brief_created', 'brief_played', 'brief_completed', 'voice_interaction', etc.
  brief_id UUID REFERENCES public.briefs(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}', -- flexible storage for interaction details
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create personalization_insights table for AI learning about users
CREATE TABLE IF NOT EXISTS public.personalization_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'topic_preference', 'mood_pattern', 'duration_preference', etc.
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_learning_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalization_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_learning_preferences
CREATE POLICY "Users can view their own learning preferences" 
ON public.user_learning_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning preferences" 
ON public.user_learning_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning preferences" 
ON public.user_learning_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning preferences" 
ON public.user_learning_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_interaction_logs
CREATE POLICY "Users can view their own interaction logs" 
ON public.user_interaction_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interaction logs" 
ON public.user_interaction_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for personalization_insights
CREATE POLICY "Users can view their own personalization insights" 
ON public.personalization_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage personalization insights" 
ON public.personalization_insights 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_learning_preferences_user_id ON public.user_learning_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interaction_logs_user_id ON public.user_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interaction_logs_type ON public.user_interaction_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_personalization_insights_user_id ON public.personalization_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_personalization_insights_type ON public.personalization_insights(insight_type);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_user_learning_preferences_updated_at
BEFORE UPDATE ON public.user_learning_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to track user interactions
CREATE OR REPLACE FUNCTION public.track_user_interaction(
  p_user_id UUID,
  p_interaction_type TEXT,
  p_brief_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_interaction_logs (user_id, interaction_type, brief_id, metadata)
  VALUES (p_user_id, p_interaction_type, p_brief_id, p_metadata);
END;
$$;

-- Create function to update user learning preferences
CREATE OR REPLACE FUNCTION public.update_user_learning_preferences(
  p_user_id UUID,
  p_preferred_mood TEXT DEFAULT NULL,
  p_preferred_duration_sec INTEGER DEFAULT NULL,
  p_favorite_topics TEXT[] DEFAULT NULL,
  p_music_preferences JSONB DEFAULT NULL,
  p_learning_style TEXT DEFAULT NULL,
  p_time_of_day_preference TEXT DEFAULT NULL,
  p_difficulty_preference TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_learning_preferences (
    user_id, 
    preferred_mood, 
    preferred_duration_sec, 
    favorite_topics, 
    music_preferences,
    learning_style,
    time_of_day_preference,
    difficulty_preference
  )
  VALUES (
    p_user_id, 
    p_preferred_mood, 
    p_preferred_duration_sec, 
    p_favorite_topics, 
    p_music_preferences,
    p_learning_style,
    p_time_of_day_preference,
    p_difficulty_preference
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    preferred_mood = COALESCE(p_preferred_mood, user_learning_preferences.preferred_mood),
    preferred_duration_sec = COALESCE(p_preferred_duration_sec, user_learning_preferences.preferred_duration_sec),
    favorite_topics = COALESCE(p_favorite_topics, user_learning_preferences.favorite_topics),
    music_preferences = COALESCE(p_music_preferences, user_learning_preferences.music_preferences),
    learning_style = COALESCE(p_learning_style, user_learning_preferences.learning_style),
    time_of_day_preference = COALESCE(p_time_of_day_preference, user_learning_preferences.time_of_day_preference),
    difficulty_preference = COALESCE(p_difficulty_preference, user_learning_preferences.difficulty_preference),
    updated_at = now();
END;
$$;