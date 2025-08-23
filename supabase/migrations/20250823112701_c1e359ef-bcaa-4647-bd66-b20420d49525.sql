-- Check if audio_segments table exists and create if needed
CREATE TABLE IF NOT EXISTS public.audio_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  segment_type TEXT NOT NULL CHECK (segment_type IN ('intro_music', 'affirmation', 'content', 'outro', 'ambient')),
  sequence_order INTEGER NOT NULL,
  script TEXT,
  audio_url TEXT,
  duration_sec INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.audio_segments ENABLE ROW LEVEL SECURITY;

-- Create policies for audio_segments
CREATE POLICY "Users can view their own audio segments" 
ON public.audio_segments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.briefs 
  WHERE briefs.id = audio_segments.brief_id 
  AND briefs.user_id = auth.uid()
));

CREATE POLICY "System can create audio segments" 
ON public.audio_segments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update audio segments" 
ON public.audio_segments 
FOR UPDATE 
USING (true);

-- Add missing columns to briefs table if they don't exist
ALTER TABLE public.briefs 
ADD COLUMN IF NOT EXISTS background_music_url TEXT,
ADD COLUMN IF NOT EXISTS total_segments INTEGER DEFAULT 1;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audio_segments_brief_id ON public.audio_segments(brief_id);
CREATE INDEX IF NOT EXISTS idx_audio_segments_sequence ON public.audio_segments(brief_id, sequence_order);