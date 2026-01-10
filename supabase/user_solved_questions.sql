-- Create table for tracking solved questions by users
CREATE TABLE IF NOT EXISTS user_solved_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  solved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE user_solved_questions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own solved questions
CREATE POLICY "Users can insert their own solved questions"
  ON user_solved_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own solved questions
CREATE POLICY "Users can read their own solved questions"
  ON user_solved_questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_solved_questions_user_id ON user_solved_questions(user_id);
