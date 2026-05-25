/*
  # Create yawmiyat (daily memories) table

  ## Purpose
  Stores daily mood entries connected to movie matches - creating a "cinematic diary" where each day's mood is linked to a film.

  ## New Tables
  - `yawmiyat`
    - `id` (uuid, primary key)
    - `session_id` (text) - anonymous session identifier
    - `date` (date) - the date of the entry (one per day per session)
    - `mood_text` (text) - user's one-sentence mood description
    - `movie_match` (jsonb) - the AI's movie match with title, poster, quote, connection
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public insert/select for matching session_id
*/

CREATE TABLE IF NOT EXISTS yawmiyat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  mood_text text NOT NULL,
  movie_match jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, date)
);

ALTER TABLE yawmiyat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert their own session memories"
  ON yawmiyat FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own session memories"
  ON yawmiyat FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS yawmiyat_session_id_idx
  ON yawmiyat (session_id);

CREATE INDEX IF NOT EXISTS yawmiyat_date_idx
  ON yawmiyat (date DESC);

CREATE INDEX IF NOT EXISTS yawmiyat_session_date_idx
  ON yawmiyat (session_id, date);
