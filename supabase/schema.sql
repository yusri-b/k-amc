-- Skema Supabase untuk Klinik Aras (Vercel + Supabase).
-- Jalankan sekali di Supabase Dashboard → SQL Editor.

create table if not exists site_content (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists site_backups (
  id bigint generated always as identity primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists site_backups_created_at_idx
  on site_backups (created_at desc);

create table if not exists login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_ip_time_idx
  on login_attempts (ip, attempted_at desc);

-- Hanya service role (dipakai route API) yang boleh mengakses tabel.
-- Tanpa policy, anon/authenticated tidak punya akses.
alter table site_content enable row level security;
alter table site_backups enable row level security;
alter table login_attempts enable row level security;

-- Bucket gambar publik (baca bebas, tulis hanya via service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-uploads',
  'clinic-uploads',
  true,
  4194304,
  array['image/webp', 'image/png', 'image/jpeg', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read clinic uploads" on storage.objects;
create policy "Public read clinic uploads"
  on storage.objects for select
  using (bucket_id = 'clinic-uploads');
