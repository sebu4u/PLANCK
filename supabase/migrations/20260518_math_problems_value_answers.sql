-- Răspunsuri numerice pentru probleme de matematică (ca la fizică: text_before / text_after / correct_value)

alter table public.math_problems
  add column if not exists answer_type text,
  add column if not exists value_subpoints jsonb;

alter table public.math_problems
  drop constraint if exists math_problems_answer_subpoints_array_check;

alter table public.math_problems
  drop column if exists answer_subpoints;

alter table public.math_problems
  drop constraint if exists math_problems_answer_type_check;

alter table public.math_problems
  add constraint math_problems_answer_type_check
  check (answer_type is null or answer_type = 'value');

alter table public.math_problems
  drop constraint if exists math_problems_answer_payload_check;

alter table public.math_problems
  add constraint math_problems_answer_payload_check
  check (
    (
      answer_type is null
      and value_subpoints is null
    )
    or (
      answer_type = 'value'
      and value_subpoints is not null
      and jsonb_typeof(value_subpoints) = 'array'
      and jsonb_array_length(value_subpoints) between 1 and 3
    )
  );
