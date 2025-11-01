-- Create loop_assets table for our ambient stems
CREATE TABLE IF NOT EXISTS public.loop_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  mood TEXT[] NOT NULL,
  key TEXT NULL,
  bpm INT NULL,
  type TEXT NOT NULL,
  duration_sec INT NOT NULL,
  license TEXT NOT NULL,
  sha256 TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create renders table to track composed audio
CREATE TABLE IF NOT EXISTS public.renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES public.briefs(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'composer:v0',
  url TEXT NOT NULL,
  peak_db NUMERIC NULL,
  diagnostics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for loop_assets (public read)
ALTER TABLE public.loop_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view loop assets"
ON public.loop_assets
FOR SELECT
USING (true);

-- RLS for renders (users view their own)
ALTER TABLE public.renders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own renders"
ON public.renders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.briefs
    WHERE briefs.id = renders.brief_id
    AND briefs.user_id = auth.uid()
  )
);

-- Storage buckets for loops, renders, tmp
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('loops', 'loops', false, 52428800, ARRAY['audio/wav', 'audio/mpeg', 'audio/ogg']),
  ('renders', 'renders', false, 104857600, ARRAY['audio/wav', 'audio/mpeg', 'audio/ogg']),
  ('tmp', 'tmp', false, 104857600, ARRAY['audio/wav', 'audio/mpeg', 'audio/ogg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for loops (public read, service role write)
CREATE POLICY "Anyone can view loops"
ON storage.objects
FOR SELECT
USING (bucket_id = 'loops');

CREATE POLICY "Service role can upload loops"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'loops' 
  AND auth.role() = 'service_role'
);

-- Storage policies for renders (users view their own)
CREATE POLICY "Users can view their own renders"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'renders'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role can upload renders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'renders'
  AND auth.role() = 'service_role'
);

-- Storage policies for tmp (service role only)
CREATE POLICY "Service role can manage tmp"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'tmp'
  AND auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'tmp'
  AND auth.role() = 'service_role'
);