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
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;

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
  created_at  timestamptz not null default now(),
  -- Filled in by review_submission() below; visitors may not set them.
  studio_id   uuid references public.studios (id) on delete set null,  -- studio the approval touched
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  review_note text
);

create index if not exists submissions_status_created_idx on public.submissions (status, created_at desc);

-- ---------- Admins: who may edit (Supabase Auth users) ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- Policies call is_admin() for signed-in users only; visitors never need it.
revoke execute on function public.is_admin() from anon, public;

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
  for insert to anon, authenticated
  with check (status = 'pending' and studio_id is null and reviewed_at is null
              and reviewed_by is null and review_note is null);

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

-- ---------- Admin writes: the dashboard (/admin) only changes studios through these ----------
-- Both run as the caller, so RLS applies on top of the is_admin() check.

-- Creates (p_id null) or updates one studio and its categories in one transaction.
-- p_studio holds the editable columns; p_categories lists all categories, primary
-- first (the primary one is skipped in studio_categories). Other columns are left alone.
create or replace function public.save_studio(
  p_id         uuid,
  p_studio     jsonb,
  p_categories text[],
  p_source     text default 'Admin'
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  target uuid := p_id;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  if target is null then
    insert into public.studios (slug, name, description, primary_category, address, area, lat, lng,
                                website, instagram, status, source, last_verified)
    values (p_studio->>'slug', p_studio->>'name', p_studio->>'description', p_studio->>'primary_category',
            p_studio->>'address', p_studio->>'area', (p_studio->>'lat')::double precision,
            (p_studio->>'lng')::double precision, nullif(p_studio->>'website', ''),
            nullif(p_studio->>'instagram', ''), coalesce(p_studio->>'status', 'draft'),
            p_source, current_date)
    returning id into target;
  else
    update public.studios set
      name             = p_studio->>'name',
      description      = p_studio->>'description',
      primary_category = p_studio->>'primary_category',
      address          = p_studio->>'address',
      area             = p_studio->>'area',
      lat              = (p_studio->>'lat')::double precision,
      lng              = (p_studio->>'lng')::double precision,
      website          = nullif(p_studio->>'website', ''),
      instagram        = nullif(p_studio->>'instagram', ''),
      status           = coalesce(p_studio->>'status', status),
      last_verified    = current_date
    where id = target;
    if not found then raise exception 'Studio not found'; end if;
  end if;

  if p_categories is not null then
    delete from public.studio_categories where studio_id = target;
    insert into public.studio_categories (studio_id, category_id)
      select target, c from unnest(p_categories) as c
      where c is distinct from p_studio->>'primary_category'
      on conflict do nothing;
  end if;

  return target;
end $$;

revoke execute on function public.save_studio(uuid, jsonb, text[], text) from anon, public;
grant execute on function public.save_studio(uuid, jsonb, text[], text) to authenticated;

-- The only way a submission changes the directory. One transaction: apply the change,
-- then mark the submission reviewed.
--   new:        p_studio holds the full record (admin fills slug, coordinates, ...)
--   correction: p_studio_id + p_studio; the editable columns are overwritten
--   removal:    p_studio_id; p_studio->>'removal' is 'unpublish' (default, back to draft) or 'delete'
create or replace function public.review_submission(
  p_id         uuid,
  p_decision   text,
  p_note       text   default null,
  p_studio_id  uuid   default null,
  p_studio     jsonb  default null,
  p_categories text[] default null
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  sub    public.submissions;
  target uuid := p_studio_id;
  linked uuid;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Unknown decision: %', p_decision;
  end if;

  select * into sub from public.submissions where id = p_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if sub.status <> 'pending' then raise exception 'Submission was already reviewed'; end if;

  if p_decision = 'approved' then
    if sub.kind = 'new' then
      target := public.save_studio(null, jsonb_build_object('status', 'published') || p_studio,
                                   p_categories, 'Formulir pendaftaran');
    elsif target is null then
      raise exception 'Choose the studio this request is about';
    elsif sub.kind = 'correction' then
      perform public.save_studio(target, p_studio, p_categories);
    elsif coalesce(p_studio->>'removal', 'unpublish') = 'delete' then
      delete from public.studios where id = target;
      if not found then raise exception 'Studio not found'; end if;
    else
      update public.studios set status = 'draft' where id = target;
      if not found then raise exception 'Studio not found'; end if;
    end if;

    linked := case when sub.kind = 'removal' and p_studio->>'removal' = 'delete' then null else target end;
  end if;

  update public.submissions set
    status      = p_decision,
    studio_id   = linked,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    review_note = nullif(btrim(p_note), '')
  where id = p_id;

  return linked;
end $$;

revoke execute on function public.review_submission(uuid, text, text, uuid, jsonb, text[]) from anon, public;
grant execute on function public.review_submission(uuid, text, text, uuid, jsonb, text[]) to authenticated;
