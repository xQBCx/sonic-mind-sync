-- Create RLS policies for the briefs storage bucket
-- Users can only upload files to their own folder
CREATE POLICY "Users can upload their own briefs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'briefs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own briefs
CREATE POLICY "Users can view their own briefs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'briefs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own briefs
CREATE POLICY "Users can update their own briefs" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'briefs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own briefs
CREATE POLICY "Users can delete their own briefs" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'briefs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure the briefs bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('briefs', 'briefs', false, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4'];