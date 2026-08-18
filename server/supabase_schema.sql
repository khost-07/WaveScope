-- WaveScope Historical Tracking Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Devices Table
create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  mac_address text unique not null,
  vendor text,
  first_seen timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Telemetry Readings Table
create table if not exists readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id) on delete cascade,
  timestamp timestamptz default now(),
  rssi numeric,
  snr numeric,
  band text,
  link_rate numeric,
  diagnosis text,
  confidence numeric
);

-- 3. Connection Events Table
create table if not exists connection_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id) on delete cascade,
  event_type text check (event_type in ('connect', 'disconnect')),
  timestamp timestamptz default now()
);

-- 4. Network Health Snapshots Table
create table if not exists network_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  health_score numeric,
  healthy_count int,
  attention_count int,
  critical_count int
);

-- Enable Row Level Security (RLS)
alter table devices enable row level security;
alter table readings enable row level security;
alter table connection_events enable row level security;
alter table network_health_snapshots enable row level security;

-- Permissive Hackathon / Demo RLS Policies
create policy "Public Access Devices" on devices for all to anon, authenticated using (true) with check (true);
create policy "Public Access Readings" on readings for all to anon, authenticated using (true) with check (true);
create policy "Public Access Events" on connection_events for all to anon, authenticated using (true) with check (true);
create policy "Public Access Snapshots" on network_health_snapshots for all to anon, authenticated using (true) with check (true);
