-- Create enum for category
DO $$ BEGIN
  CREATE TYPE event_category AS ENUM ('class','assignment','exam','work','personal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  category event_category not null default 'personal',
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  all_day boolean default false,
  location text,
  description text,
  is_done boolean default false,
  priority int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists events_user_start_idx on public.events (user_id, start_ts);

-- RLS example policies (enable and adapt once Auth is used)
-- alter table public.events enable row level security;
-- create policy "own rows" on public.events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

