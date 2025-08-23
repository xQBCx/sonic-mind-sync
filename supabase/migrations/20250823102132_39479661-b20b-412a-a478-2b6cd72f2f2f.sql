-- Extend briefs table to support multi-segment audio structure
ALTER TABLE public.briefs 
ADD COLUMN segments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN flow_type TEXT DEFAULT 'single' CHECK (flow_type IN ('single', 'morning', 'midday', 'study', 'winddown')),
ADD COLUMN background_music_url TEXT,
ADD COLUMN total_segments INTEGER DEFAULT 1;

-- Add index for better performance on flow queries
CREATE INDEX idx_briefs_flow_type ON public.briefs(flow_type);

-- Create audio_segments table for managing individual segments
CREATE TABLE public.audio_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  segment_type TEXT NOT NULL CHECK (segment_type IN ('intro_music', 'affirmation', 'content', 'outro', 'ambient')),
  sequence_order INTEGER NOT NULL,
  audio_url TEXT,
  script TEXT,
  duration_sec INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_segments ENABLE ROW LEVEL SECURITY;

-- RLS policies for audio_segments
CREATE POLICY "Users can view their own audio segments" 
ON public.audio_segments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.briefs 
    WHERE briefs.id = audio_segments.brief_id 
    AND briefs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own audio segments" 
ON public.audio_segments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.briefs 
    WHERE briefs.id = audio_segments.brief_id 
    AND briefs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own audio segments" 
ON public.audio_segments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.briefs 
    WHERE briefs.id = audio_segments.brief_id 
    AND briefs.user_id = auth.uid()
  )
);

-- Add unique constraint for segment order per brief
ALTER TABLE public.audio_segments 
ADD CONSTRAINT unique_brief_segment_order 
UNIQUE (brief_id, sequence_order);

-- Update trigger for audio_segments
CREATE TRIGGER update_audio_segments_updated_at
BEFORE UPDATE ON public.audio_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();