-- Parent-configurable target grade per parent-child relationship
-- Additive-only migration (no DROP / no CREATE OR REPLACE)

alter table if exists public.parent_child_relationships
  add column if not exists target_grade numeric(3, 1) not null default 9
    check (target_grade >= 1 and target_grade <= 10);
