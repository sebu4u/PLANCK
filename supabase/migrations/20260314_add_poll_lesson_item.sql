-- Add 'poll' item type and content_json for poll data to learning_path_lesson_items

alter table public.learning_path_lesson_items
  drop constraint if exists learning_path_lesson_items_item_type_check;

alter table public.learning_path_lesson_items
  add constraint learning_path_lesson_items_item_type_check
  check (item_type in ('text', 'video', 'grila', 'problem', 'poll'));

alter table public.learning_path_lesson_items
  add column if not exists content_json jsonb;
