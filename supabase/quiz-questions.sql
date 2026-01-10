-- Quiz Questions Table for Grid Tests (Teste Grilă)
-- Completely isolated from the existing 'problems' table
-- Questions are manually added via Supabase dashboard

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(50) UNIQUE NOT NULL,
  class INTEGER NOT NULL CHECK (class IN (9, 10, 11, 12)),
  statement TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty IN (1, 2, 3)),
  answers JSONB NOT NULL,
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E', 'F')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by class
CREATE INDEX IF NOT EXISTS idx_quiz_questions_class ON quiz_questions(class);

-- Enable Row Level Security
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (questions are public)
CREATE POLICY "Allow public read access to quiz questions"
  ON quiz_questions
  FOR SELECT
  TO public
  USING (true);

-- Example insert (can be removed, just for reference):
-- INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer)
-- VALUES (
--   'FIZ-IX-001',
--   9,
--   'Care este unitatea de măsură pentru forță în Sistemul Internațional?',
--   1,
--   '{"A": "Kilogram (kg)", "B": "Newton (N)", "C": "Joule (J)", "D": "Watt (W)", "E": "Pascal (Pa)", "F": "Metru (m)"}',
--   'B'
-- );
