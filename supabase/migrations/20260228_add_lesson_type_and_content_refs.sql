alter table public.learning_path_lessons
  add column if not exists lesson_type text not null default 'text',
  add column if not exists cursuri_lesson_slug text,
  add column if not exists youtube_url text,
  add column if not exists quiz_question_id uuid references public.quiz_questions(id) on delete set null,
  add column if not exists problem_id text;

alter table public.learning_path_lessons
  drop constraint if exists learning_path_lessons_lesson_type_check;

alter table public.learning_path_lessons
  add constraint learning_path_lessons_lesson_type_check
  check (lesson_type in ('text', 'video', 'grila', 'problem'));

create index if not exists idx_learning_path_lessons_quiz_question_id
  on public.learning_path_lessons(quiz_question_id);

create index if not exists idx_learning_path_lessons_problem_id
  on public.learning_path_lessons(problem_id);
