/*
  # Create quotes table for اقتباساتي

  ## Purpose
  Stores user's saved quotes from movies, series, and anime, plus a curated daily quote feature.

  ## New Tables
  - `quotes`
    - `id` (uuid, primary key)
    - `session_id` (text) - anonymous session identifier  
    - `quote_text` (text) - the quote content
    - `title` (text) - movie/series/anime title
    - `title_ar` (text) - Arabic title
    - `character_name` (text) - character who said it
    - `type` (text) - movie/series/anime
    - `is_curated` (boolean) - whether it's a featured curated quote
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public insert/select
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  quote_text text NOT NULL,
  title text NOT NULL,
  title_ar text DEFAULT '',
  character_name text DEFAULT '',
  type text DEFAULT 'movie',
  is_curated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quotes"
  ON quotes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read quotes"
  ON quotes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS quotes_session_id_idx ON quotes (session_id);
CREATE INDEX IF NOT EXISTS quotes_curated_idx ON quotes (is_curated);
CREATE INDEX IF NOT EXISTS quotes_created_at_idx ON quotes (created_at DESC);
