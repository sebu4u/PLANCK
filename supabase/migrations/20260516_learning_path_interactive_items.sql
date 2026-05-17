-- Extend learning path lesson items with interactive / practice item kinds (content_json driven).

alter table public.learning_path_lesson_items
  drop constraint if exists learning_path_lesson_items_item_type_check;

alter table public.learning_path_lesson_items
  add constraint learning_path_lesson_items_item_type_check
  check (item_type in (
    'text',
    'video',
    'grila',
    'problem',
    'poll',
    'custom_text',
    'simulation',
    'test',
    'card_sort',
    'fill_slot',
    'match',
    'graph_build',
    'code_trace',
    'swipe_classify',
    'flow_build',
    'slider_explore',
    'table_fill',
    'memory_flip',
    'speed_round',
    'reveal_steps'
  ));
