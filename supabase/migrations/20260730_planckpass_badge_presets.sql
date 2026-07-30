-- Seed the 5 PLANCKPASS badge presets (idempotent upsert by fixed UUID).

insert into public.planckpass_cosmetics (id, kind, name, image_url, meta)
values
  (
    'b1000001-0000-4000-8000-000000000001',
    'badge',
    'Nova',
    '/images/planckpass/badges/nova-star.svg',
    '{"presetId":"nova-star"}'::jsonb
  ),
  (
    'b1000001-0000-4000-8000-000000000002',
    'badge',
    'Scut Ember',
    '/images/planckpass/badges/ember-shield.svg',
    '{"presetId":"ember-shield"}'::jsonb
  ),
  (
    'b1000001-0000-4000-8000-000000000003',
    'badge',
    'Medalie de Aur',
    '/images/planckpass/badges/gold-medal.svg',
    '{"presetId":"gold-medal"}'::jsonb
  ),
  (
    'b1000001-0000-4000-8000-000000000004',
    'badge',
    'Gemă',
    '/images/planckpass/badges/crystal-gem.svg',
    '{"presetId":"crystal-gem"}'::jsonb
  ),
  (
    'b1000001-0000-4000-8000-000000000005',
    'badge',
    'Cometă',
    '/images/planckpass/badges/comet-trail.svg',
    '{"presetId":"comet-trail"}'::jsonb
  )
on conflict (id) do update set
  kind = excluded.kind,
  name = excluded.name,
  image_url = excluded.image_url,
  meta = excluded.meta;
