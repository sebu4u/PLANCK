-- Insert template for contest results.
-- Run this in Supabase SQL Editor after running the migration
-- 20260327_create_contest_results_table.sql

INSERT INTO public.contest_results (grade, position, student_name, school, score, prize)
VALUES
  -- Clasa IX
  ('IX', 1, 'Nume Elev 1', 'Liceul Exemplu 1', 97.50, 'Premiul I'),
  ('IX', 2, 'Nume Elev 2', 'Liceul Exemplu 2', 95.00, 'Premiul II'),

  -- Clasa X
  ('X', 1, 'Nume Elev 3', 'Liceul Exemplu 3', 98.00, 'Premiul I'),
  ('X', 2, 'Nume Elev 4', 'Liceul Exemplu 4', 94.75, 'Premiul II'),

  -- Clasa XI
  ('XI', 1, 'Nume Elev 5', 'Liceul Exemplu 5', 99.00, 'Premiul I'),
  ('XI', 2, 'Nume Elev 6', 'Liceul Exemplu 6', 96.25, 'Premiul II'),

  -- Clasa XII
  ('XII', 1, 'Nume Elev 7', 'Liceul Exemplu 7', 98.50, 'Premiul I'),
  ('XII', 2, 'Nume Elev 8', 'Liceul Exemplu 8', 95.50, 'Premiul II');
