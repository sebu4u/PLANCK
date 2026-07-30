-- Seed the 10 PLANCKPASS border presets (idempotent upsert by fixed UUID).

insert into public.planckpass_cosmetics (id, kind, name, image_url, meta)
values
  (
    'a1000001-0000-4000-8000-000000000001',
    'border',
    'Orbital',
    '/images/planckpass/borders/orbit-rings.svg',
    '{"presetId":"orbit-rings"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-000000000002',
    'border',
    'Circuit Neon',
    '/images/planckpass/borders/neon-circuit.svg',
    '{"presetId":"neon-circuit"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-000000000003',
    'border',
    'Constelație',
    '/images/planckpass/borders/constellation.svg',
    '{"presetId":"constellation"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-000000000004',
    'border',
    'Emberi',
    '/images/planckpass/borders/ember-flame.svg',
    '{"presetId":"ember-flame"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-000000000005',
    'border',
    'Prismă',
    '/images/planckpass/borders/crystal-prism.svg',
    '{"presetId":"crystal-prism"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-000000000006',
    'border',
    'Auroră',
    '/images/planckpass/borders/aurora-flow.svg',
    '{"presetId":"aurora-flow"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-000000000007',
    'border',
    'Lauri de Aur',
    '/images/planckpass/borders/golden-laurel.svg',
    '{"presetId":"golden-laurel"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-000000000008',
    'border',
    'Glitch',
    '/images/planckpass/borders/pixel-glitch.svg',
    '{"presetId":"pixel-glitch"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-000000000009',
    'border',
    'Portal',
    '/images/planckpass/borders/void-portal.svg',
    '{"presetId":"void-portal"}'::jsonb
  ),
  (
    'a1000001-0000-4000-8000-00000000000a',
    'border',
    'Confetti Crown',
    '/images/planckpass/borders/confetti-crown.svg',
    '{"presetId":"confetti-crown"}'::jsonb
  )
on conflict (id) do update set
  kind = excluded.kind,
  name = excluded.name,
  image_url = excluded.image_url,
  meta = excluded.meta;
