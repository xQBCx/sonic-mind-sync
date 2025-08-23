-- Add sound_effect_url column to briefs table
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS sound_effect_url TEXT;