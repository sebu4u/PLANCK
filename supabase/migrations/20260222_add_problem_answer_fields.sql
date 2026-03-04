-- Add answer configuration fields for physics problems.
-- A problem can have either numeric subpoints (value) or a single multiple-choice answer (grila).

alter table public.problems
  add column if not exists answer_type text,
  add column if not exists value_subpoints jsonb,
  add column if not exists grila_options jsonb,
  add column if not exists grila_correct_index smallint;

alter table public.problems
  drop constraint if exists problems_answer_type_check;

alter table public.problems
  add constraint problems_answer_type_check
  check (answer_type is null or answer_type in ('value', 'grila'));

alter table public.problems
  drop constraint if exists problems_grila_correct_index_check;

alter table public.problems
  add constraint problems_grila_correct_index_check
  check (grila_correct_index is null or grila_correct_index between 0 and 2);

alter table public.problems
  drop constraint if exists problems_answer_payload_check;

alter table public.problems
  add constraint problems_answer_payload_check
  check (
    (
      answer_type is null
      and value_subpoints is null
      and grila_options is null
      and grila_correct_index is null
    )
    or (
      answer_type = 'value'
      and value_subpoints is not null
      and jsonb_typeof(value_subpoints) = 'array'
      and jsonb_array_length(value_subpoints) between 1 and 3
      and grila_options is null
      and grila_correct_index is null
    )
    or (
      answer_type = 'grila'
      and value_subpoints is null
      and grila_options is not null
      and jsonb_typeof(grila_options) = 'array'
      and jsonb_array_length(grila_options) = 3
      and grila_correct_index is not null
    )
  );
