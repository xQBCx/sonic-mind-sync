-- Fix function search path issues by setting search_path
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON 
SET search_path = public
AS $$
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