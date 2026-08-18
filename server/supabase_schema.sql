-- WaveScope Historical Tracking Schema + Permissions
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query > Click "RUN")

-- 1. Create Tables in public schema
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  mac_address text unique not null,
  vendor text,
  first_seen timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade,
  timestamp timestamptz default now(),
  rssi numeric,
  snr numeric,
  band text,
  link_rate numeric,
  diagnosis text,
  confidence numeric
);

create table if not exists public.connection_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade,
  event_type text check (event_type in ('connect', 'disconnect')),
  timestamp timestamptz default now()
);

create table if not exists public.network_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  health_score numeric,
  healthy_count int,
  attention_count int,
  critical_count int
);

-- 2. Grant permissions to Data API roles (anon & authenticated)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;

-- 3. Enable Row Level Security (RLS) & Permissive Policies
alter table public.devices enable row level security;
alter table public.readings enable row level security;
alter table public.connection_events enable row level security;
alter table public.network_health_snapshots enable row level security;

drop policy if exists "Public Devices" on public.devices;
drop policy if exists "Public Readings" on public.readings;
drop policy if exists "Public Events" on public.connection_events;
drop policy if exists "Public Snapshots" on public.network_health_snapshots;

create policy "Public Devices" on public.devices for all to anon, authenticated using (true) with check (true);
create policy "Public Readings" on public.readings for all to anon, authenticated using (true) with check (true);
create policy "Public Events" on public.connection_events for all to anon, authenticated using (true) with check (true);
create policy "Public Snapshots" on public.network_health_snapshots for all to anon, authenticated using (true) with check (true);

-- 4. Reload PostgREST API Schema Cache
notify pgrst, 'reload schema';
