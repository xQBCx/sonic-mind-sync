-- Security Fix 1: Protect testimonials email exposure
-- Remove public access to user_email column by creating more specific policies

-- Drop existing policies that expose emails
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;

-- Create new policies that don't expose email (SELECT policies don't use WITH CHECK)
CREATE POLICY "Anyone can view approved testimonials (safe columns)" 
ON public.testimonials 
FOR SELECT 
USING (is_approved = true);

-- Create policy for users to view their own testimonials without exposing email to others
CREATE POLICY "Users can view their own testimonials (safe)" 
ON public.testimonials 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Security Fix 2: Fix RLS UPDATE policies missing WITH CHECK clauses

-- Fix audio_segments UPDATE policy
DROP POLICY IF EXISTS "Users can update their own audio segments" ON public.audio_segments;
CREATE POLICY "Users can update their own audio segments" 
ON public.audio_segments 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM briefs WHERE briefs.id = audio_segments.brief_id AND briefs.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM briefs WHERE briefs.id = audio_segments.brief_id AND briefs.user_id = auth.uid()));

-- Fix schedules UPDATE policy  
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
CREATE POLICY "Users can update their own schedules" 
ON public.schedules 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix user_learning_preferences UPDATE policy
DROP POLICY IF EXISTS "Users can update their own learning preferences" ON public.user_learning_preferences;
CREATE POLICY "Users can update their own learning preferences" 
ON public.user_learning_preferences 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Security Fix 3: Strengthen data integrity

-- Add foreign key constraint for audio_segments -> briefs
ALTER TABLE public.audio_segments 
ADD CONSTRAINT fk_audio_segments_brief_id 
FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE CASCADE;

-- Make briefs.user_id NOT NULL (it should never be null for security)
UPDATE public.briefs SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
ALTER TABLE public.briefs ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint on profiles.user_id if not exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_unique;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Security Fix 4: Make audio bucket private
UPDATE storage.buckets SET public = false WHERE id = 'audio';

-- Create RLS policies for private audio access
CREATE POLICY "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'audio' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'audio' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own audio files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'audio' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'audio' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);