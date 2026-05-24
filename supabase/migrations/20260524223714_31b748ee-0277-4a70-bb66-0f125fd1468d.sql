
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS mood_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS auto_mood text;
