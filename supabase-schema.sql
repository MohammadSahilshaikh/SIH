-- ================================================================
-- Corridor — Supabase schema
-- Run this once in your Supabase project's SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ================================================================

create extension if not exists "pgcrypto";

-- Junctions: one row per traffic signal in the network
create table if not exists junctions (
  id text primary key,
  name text not null,
  status text not null default 'normal',        -- 'normal' | 'emergency_green'
  active_direction text not null default 'NS',   -- 'NS' | 'EW'
  updated_at timestamptz not null default now()
);

-- Emergency requests: one row per ambulance/fire/police priority request
create table if not exists emergency_requests (
  id uuid primary key default gen_random_uuid(),
  vehicle_type text not null,
  vehicle_number text not null,
  driver_contact text,
  current_junction text not null,
  destination text not null,
  notes text,
  route jsonb not null default '[]',             -- array of junction ids, e.g. ["J1","J2","J3"]
  status text not null default 'pending',        -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at timestamptz not null default now()
);

-- Seed the six demo junctions
insert into junctions (id, name) values
  ('J1', 'MG Road Junction'),
  ('J2', 'Station Road Junction'),
  ('J3', 'Ring Road Circle'),
  ('J4', 'Hospital Chowk'),
  ('J5', 'City Center Square'),
  ('J6', 'Highway Entry Point')
on conflict (id) do nothing;

-- ================================================================
-- Row Level Security
-- ================================================================
-- These policies are deliberately open (anon can read/write) so the
-- hackathon prototype works with zero auth setup. Before any real
-- deployment, replace with policies scoped to authenticated
-- dispatcher/operator roles.

alter table junctions enable row level security;
alter table emergency_requests enable row level security;

create policy "Public read junctions" on junctions
  for select using (true);
create policy "Public update junctions" on junctions
  for update using (true);

create policy "Public read requests" on emergency_requests
  for select using (true);
create policy "Public insert requests" on emergency_requests
  for insert with check (true);
create policy "Public update requests" on emergency_requests
  for update using (true);

-- ================================================================
-- Realtime
-- ================================================================
-- Enable realtime on emergency_requests so the dashboard gets
-- pushed updates instead of only polling.
-- Dashboard UI: Database → Replication → toggle "emergency_requests" on.
-- Or run:
alter publication supabase_realtime add table emergency_requests;
