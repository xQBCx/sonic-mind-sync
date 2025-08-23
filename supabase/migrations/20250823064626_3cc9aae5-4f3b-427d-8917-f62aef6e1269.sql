-- Create a function to safely create user profiles
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id uuid,
  p_age integer DEFAULT NULL,
  p_origin text DEFAULT NULL,
  p_interests text DEFAULT NULL,
  p_language_preference text DEFAULT NULL,
  p_learning_goals text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, age, origin, interests, language_preference, learning_goals)
  VALUES (p_user_id, p_age, p_origin, p_interests, p_language_preference, p_learning_goals)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    age = COALESCE(p_age, profiles.age),
    origin = COALESCE(p_origin, profiles.origin),
    interests = COALESCE(p_interests, profiles.interests),
    language_preference = COALESCE(p_language_preference, profiles.language_preference),
    learning_goals = COALESCE(p_learning_goals, profiles.learning_goals),
    updated_at = now();
END;
$$;