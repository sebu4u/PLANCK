-- Add image_url column to training_questions table
alter table public.training_questions 
add column if not exists image_url text;

-- Add comment
comment on column public.training_questions.image_url is 'Optional URL to an image displayed below the question statement';
