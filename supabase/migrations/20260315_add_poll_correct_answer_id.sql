-- Add correctAnswerId to existing poll items
-- For the vectors poll (Ion/Maria), "maria" is the correct answer
update public.learning_path_lesson_items
set content_json = content_json || '{"correctAnswerId": "maria"}'::jsonb
where item_type = 'poll'
  and content_json ? 'options'
  and not (content_json ? 'correctAnswerId')
  and exists (
    select 1 from jsonb_array_elements(content_json->'options') opt
    where opt->>'id' = 'maria'
  );
