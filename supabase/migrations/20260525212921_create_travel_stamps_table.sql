/*
  # Create travel stamps table for سافر بالأفلام

  ## Purpose
  Stores movie/series watch logs with country stamps - creating a "cinematic passport" of countries visited through films.

  ## New Tables
  - `travel_stamps`
    - `id` (uuid, primary key)
    - `session_id` (text) - anonymous session identifier  
    - `title` (text) - movie/series name
    - `title_ar` (text) - Arabic title
    - `type` (text) - movie/series/anime
    - `country` (text) - the movie's country
    - `country_ar` (text) - Arabic country name
    - `region` (text) - region/continent
    - `poster_url` (text) - optional poster image
    - `watched_at` (date) - when watched
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public insert/select
*/

CREATE TABLE IF NOT EXISTS travel_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  title text NOT NULL,
  title_ar text DEFAULT '',
  type text DEFAULT 'movie',
  country text NOT NULL,
  country_ar text DEFAULT '',
  region text DEFAULT '',
  poster_url text DEFAULT '',
  watched_at date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE travel_stamps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert stamps"
  ON travel_stamps FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read stamps"
  ON travel_stamps FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS travel_stamps_session_id_idx ON travel_stamps (session_id);
CREATE INDEX IF NOT EXISTS travel_stamps_country_idx ON travel_stamps (country);
CREATE INDEX IF NOT EXISTS travel_stamps_watched_at_idx ON travel_stamps (watched_at DESC);
