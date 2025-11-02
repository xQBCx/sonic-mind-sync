-- Update the mood check constraint to allow new mood options
ALTER TABLE briefs DROP CONSTRAINT IF EXISTS briefs_mood_check;

ALTER TABLE briefs ADD CONSTRAINT briefs_mood_check 
CHECK (mood IN ('focus', 'energize', 'calm', 'morning', 'deep', 'background', 'energy'));
