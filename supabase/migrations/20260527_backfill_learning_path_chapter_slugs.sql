with chapter_sources as (
  select
    id,
    order_index,
    created_at,
    coalesce(
      nullif(
        regexp_replace(
          regexp_replace(lower(unaccent(title)), '[^a-z0-9]+', '-', 'g'),
          '(^-+|-+$)',
          '',
          'g'
        ),
        ''
      ),
      'capitol'
    ) as base_slug
  from public.learning_path_chapters
),
ranked_slugs as (
  select
    id,
    case
      when row_number() over (
        partition by base_slug
        order by order_index, created_at, id
      ) = 1 then base_slug
      else base_slug || '-' || row_number() over (
        partition by base_slug
        order by order_index, created_at, id
      )
    end as resolved_slug
  from chapter_sources
)
update public.learning_path_chapters as chapters
set slug = ranked_slugs.resolved_slug
from ranked_slugs
where chapters.id = ranked_slugs.id
  and coalesce(nullif(btrim(chapters.slug), ''), '') = '';
