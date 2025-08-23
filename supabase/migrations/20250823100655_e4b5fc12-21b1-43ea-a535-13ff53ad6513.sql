-- Create schedules table for daily routine engine
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL, -- "Morning Boost", "Midday Focus", "Evening Wind-down"
  schedule_time TIME NOT NULL, -- e.g., '07:00:00' for 7 AM
  timezone TEXT DEFAULT 'UTC',
  mood TEXT NOT NULL, -- energizing, focused, calming, etc.
  duration_sec INTEGER NOT NULL DEFAULT 300, -- 5 minutes default
  topics TEXT[] DEFAULT '{}', -- array of topics like ['AI', 'productivity']
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own schedules" 
ON public.schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules" 
ON public.schedules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" 
ON public.schedules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" 
ON public.schedules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_analytics table for data collection
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'play', 'pause', 'skip', 'complete', 'replay', 'feedback'
  brief_id UUID, -- reference to briefs table
  session_duration_sec INTEGER,
  context JSONB, -- store contextual data like time_of_day, device_type, mood_rating
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for analytics
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics (users can only see their own data)
CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_active ON public.schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_analytics_user_event ON public.user_analytics(user_id, event_type);
CREATE INDEX idx_analytics_created_at ON public.user_analytics(created_at);

-- Create function to track user events
CREATE OR REPLACE FUNCTION public.track_user_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_brief_id UUID DEFAULT NULL,
  p_session_duration_sec INTEGER DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_analytics (user_id, event_type, brief_id, session_duration_sec, context)
  VALUES (p_user_id, p_event_type, p_brief_id, p_session_duration_sec, p_context);
END;
$$;