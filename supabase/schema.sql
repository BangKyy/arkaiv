-- Arkaiv database schema (PRD sections 8, 11, 12).
-- Apply in the Supabase SQL editor or as a migration. Not applied automatically.
-- The browser only ever uses the publishable key; RLS below is what keeps it safe.

-- ---------- Categories: editable records, not a fixed list ----------
create table if not exists public.categories (
  id         text primary key,             -- e.g. 'branding'
  name       text not null,
  icon       text not null,                -- icon key used by the front end
  sort       int  not null default 0
);

insert into public.categories (id, name, icon, sort) values
  ('branding', 'Branding', 'branding', 1),
  ('editorial', 'Editorial', 'editorial', 2),
  ('motion', 'Motion & Animation', 'motion', 3),
  ('advertising', 'Advertising', 'advertising', 4),
  ('illustration', 'Illustration', 'illustration', 5),
  ('uiux', 'UI/UX', 'uiux', 6)
on conflict (id) do nothing;

-- ---------- Studios ----------
create table if not exists public.studios (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  code              text unique,           -- area code + running number, e.g. 'P-SUB-01' (book numbering)
  name              text not null,
  description       text not null check (char_length(description) <= 300),
  about             text,
  primary_category  text not null references public.categories (id),
  specialties       text[] not null default '{}',
  address           text not null,
  area              text not null check (area in ('pusat', 'utara', 'timur', 'selatan', 'barat')),
  lat               double precision not null,
  lng               double precision not null,
  website           text,
  instagram         text,                  -- stored as handle, shown as link
  contact_email     text,                  -- publish only with the studio's consent
  contact_whatsapp  text,                  -- publish only with the studio's consent
  accent            text check (accent ~ '^c(0[1-9]|1[0-2])$'),
  logo_url          text,
  cover_url         text,
  people            jsonb not null default '[]',   -- [{ "name", "role" }]
  approach          text,
  projects          jsonb not null default '[]',   -- [{ "title", "year", "category" }]
  photos            jsonb not null default '[]',   -- [{ "src", "alt", "tag": People|Environment|Activity|Process|Work }]
  status            text not null default 'draft' check (status in ('draft', 'published', 'needs_review')),
  source            text not null,                 -- where the record came from (internal)
  last_verified     date,                          -- internal; shown on profiles
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint studios_has_public_link check (coalesce(website, '') <> '' or coalesce(instagram, '') <> '')
);

-- Additional categories (the primary one lives on studios.primary_category).
-- PRD section 11: one primary plus up to two others.
create table if not exists public.studio_categories (
  studio_id    uuid not null references public.studios (id) on delete cascade,
  category_id  text not null references public.categories (id),
  primary key (studio_id, category_id)
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists studios_touch on public.studios;
create trigger studios_touch before update on public.studios
  for each row execute function public.touch_updated_at();

-- ---------- Submissions: insert-only review queue (FR-13) ----------
create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('new', 'correction', 'removal')),
  studio_slug text,                        -- set for corrections and removals
  payload     jsonb not null check (pg_column_size(payload) < 16000),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

-- ---------- Admins: who may edit (Supabase Auth users) ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- ---------- Row level security ----------
alter table public.categories        enable row level security;
alter table public.studios           enable row level security;
alter table public.studio_categories enable row level security;
alter table public.submissions       enable row level security;
alter table public.admins            enable row level security;

-- Public: read categories and published studios only.
create policy "public read categories" on public.categories
  for select to anon, authenticated using (true);

create policy "public read published studios" on public.studios
  for select to anon, authenticated using (status = 'published');

create policy "public read categories of published studios" on public.studio_categories
  for select to anon, authenticated
  using (exists (select 1 from public.studios s where s.id = studio_id and s.status = 'published'));

-- Public: submit only, always as pending; never read back.
-- Add a bot check (e.g. an Edge Function verifying a captcha) before opening this up.
create policy "public insert pending submissions" on public.submissions
  for insert to anon, authenticated with check (status = 'pending');

-- Admins: full access.
create policy "admin all categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all studios" on public.studios
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all studio_categories" on public.studio_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all submissions" on public.submissions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read admins" on public.admins
  for select to authenticated using (public.is_admin());
