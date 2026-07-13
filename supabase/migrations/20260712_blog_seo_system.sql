-- SEO blog: categories, rich-text articles, public read policies, and admin-only management.

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint blog_categories_name_not_blank check (length(trim(name)) > 0),
  constraint blog_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  faq_items jsonb not null default '[]'::jsonb,
  cover_image_url text,
  cover_image_alt text,
  meta_title text,
  meta_description text,
  canonical_path text,
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published')),
  published_at timestamptz,
  author_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint blog_posts_title_not_blank check (length(trim(title)) > 0),
  constraint blog_posts_excerpt_not_blank check (length(trim(excerpt)) > 0),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_cover_alt_required check (
    cover_image_url is null or length(trim(coalesce(cover_image_alt, ''))) > 0
  ),
  constraint blog_posts_publishable_requires_date check (
    status not in ('scheduled', 'published') or published_at is not null
  ),
  constraint blog_posts_content_is_object check (jsonb_typeof(content) = 'object'),
  constraint blog_posts_faq_is_array check (jsonb_typeof(faq_items) = 'array')
);

create table if not exists public.blog_post_categories (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  category_id uuid not null references public.blog_categories(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (post_id, category_id)
);

create index if not exists idx_blog_posts_published_at
  on public.blog_posts (published_at desc)
  where status = 'published';
create index if not exists idx_blog_posts_slug on public.blog_posts (slug);
create index if not exists idx_blog_categories_slug on public.blog_categories (slug);
create index if not exists idx_blog_post_categories_category_id
  on public.blog_post_categories (category_id, post_id);

alter table if exists public.blog_categories enable row level security;
alter table if exists public.blog_posts enable row level security;
alter table if exists public.blog_post_categories enable row level security;

drop policy if exists "blog_categories_public_select" on public.blog_categories;
create policy "blog_categories_public_select"
  on public.blog_categories for select
  to anon, authenticated
  using (exists (
    select 1
    from public.blog_post_categories bpc
    join public.blog_posts bp on bp.id = bpc.post_id
    where bpc.category_id = blog_categories.id
      and bp.status = 'published'
      and bp.published_at <= now()
  ));

drop policy if exists "blog_categories_admin_all" on public.blog_categories;
create policy "blog_categories_admin_all"
  on public.blog_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "blog_posts_public_select" on public.blog_posts;
create policy "blog_posts_public_select"
  on public.blog_posts for select
  to anon, authenticated
  using (status = 'published' and published_at <= now());

drop policy if exists "blog_posts_admin_all" on public.blog_posts;
create policy "blog_posts_admin_all"
  on public.blog_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "blog_post_categories_public_select" on public.blog_post_categories;
create policy "blog_post_categories_public_select"
  on public.blog_post_categories for select
  to anon, authenticated
  using (exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_post_categories.post_id
      and bp.status = 'published'
      and bp.published_at <= now()
  ));

drop policy if exists "blog_post_categories_admin_all" on public.blog_post_categories;
create policy "blog_post_categories_admin_all"
  on public.blog_post_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Images must be publicly readable for statically generated article pages; writes remain admin-only.
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

drop policy if exists "blog_images_public_read" on storage.objects;
create policy "blog_images_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'blog-images');

drop policy if exists "blog_images_admin_insert" on storage.objects;
create policy "blog_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images' and public.is_admin());

drop policy if exists "blog_images_admin_update" on storage.objects;
create policy "blog_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images' and public.is_admin())
  with check (bucket_id = 'blog-images' and public.is_admin());

drop policy if exists "blog_images_admin_delete" on storage.objects;
create policy "blog_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images' and public.is_admin());
