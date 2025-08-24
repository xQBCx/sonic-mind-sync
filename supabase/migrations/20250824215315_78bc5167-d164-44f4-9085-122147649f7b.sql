-- Create testimonials table for real user testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  testimonial_text TEXT NOT NULL,
  user_name TEXT,
  user_title TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies for testimonials
CREATE POLICY "Anyone can insert testimonials" 
ON public.testimonials 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view approved testimonials" 
ON public.testimonials 
FOR SELECT 
USING (is_approved = true);

-- Service role can manage all testimonials
CREATE POLICY "Service role can manage testimonials" 
ON public.testimonials 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to get real stats
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'early_adopters', (SELECT COUNT(*) FROM auth.users),
    'waiting_list_count', COALESCE((SELECT COUNT(*) FROM profiles WHERE origin = 'waitlist'), 0),
    'briefs_generated', (SELECT COUNT(*) FROM briefs),
    'active_schedules', (SELECT COUNT(*) FROM schedules WHERE is_active = true)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;