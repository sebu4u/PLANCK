-- Enable Realtime for sketch_board_pages table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Check if table exists in publication
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'sketch_board_pages'
    ) THEN 'Table already in Realtime publication'
    ELSE 'Table NOT in Realtime publication - will add it'
  END as status;

-- Add table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE sketch_board_pages;

-- Verify it was added
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'sketch_board_pages';

