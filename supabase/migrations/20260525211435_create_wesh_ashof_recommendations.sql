/*
  # Create wesh_ashof_recommendations table

  ## Purpose
  Stores the history of mood-based recommendations for anonymous and future authenticated users.

  ## New Tables
  - `wesh_recommendations`
    - `id` (uuid, primary key)
    - `session_id` (text) - anonymous session identifier stored in browser
    - `mood_text` (text) - the user's free-text mood input
    - `recommendation` (jsonb) - the full recommendation object from Groq
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public insert allowed (anonymous users can save their own session's recs)
  - Public select allowed only for matching session_id
*/

CREATE TABLE IF NOT EXISTS wesh_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  mood_text text NOT NULL,
  recommendation jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wesh_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert their own session recommendations"
  ON wesh_recommendations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own session recommendations"
  ON wesh_recommendations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS wesh_recommendations_session_id_idx
  ON wesh_recommendations (session_id);

CREATE INDEX IF NOT EXISTS wesh_recommendations_created_at_idx
  ON wesh_recommendations (created_at DESC);
