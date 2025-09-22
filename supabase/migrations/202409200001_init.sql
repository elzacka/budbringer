create extension if not exists vector;
create extension if not exists citext;

-- Table: subscribers
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'form' check (source in ('form', 'admin')),
  language text not null default 'nb-NO',
  preferences jsonb,
  last_sent_at timestamptz
);

create index if not exists subscribers_status_idx on public.subscribers(status);
create index if not exists subscribers_last_sent_idx on public.subscribers(last_sent_at);

-- Table: prompts
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default false,
  version integer not null default 1,
  tags text[] default array[]::text[],
  notes text
);

create index if not exists prompts_is_active_idx on public.prompts(is_active);
create index if not exists prompts_version_idx on public.prompts(version desc);

-- Table: digest_runs
create table if not exists public.digest_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  executed_for date not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  model_used text,
  prompt_id uuid references public.prompts (id) on delete set null,
  summary_html text,
  summary_markdown text,
  summary_plain text,
  audio_url text,
  metadata jsonb,
  error text
);

create index if not exists digest_runs_executed_for_idx on public.digest_runs(executed_for desc);

-- Table: news_items
create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  url text not null,
  title text not null,
  source text not null,
  published_at timestamptz,
  language text,
  raw_content text,
  summary text,
  embedding vector(768),
  tags text[]
);

create unique index if not exists news_items_url_idx on public.news_items(url);
create index if not exists news_items_published_idx on public.news_items(published_at desc);

-- RLS policies
alter table public.subscribers enable row level security;
alter table public.prompts enable row level security;
alter table public.digest_runs enable row level security;
alter table public.news_items enable row level security;

-- Admin role must be granted manually in Supabase via auth.users metadata

create policy "Public form can register" on public.subscribers
  for insert
  with check (auth.role() = 'anon');

create policy "Admins can read subscribers" on public.subscribers
  for select using (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  );

create policy "Admins can manage subscribers" on public.subscribers
  for all using (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  )
  with check (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  );

create policy "Admins read prompts" on public.prompts
  for select using (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  );

create policy "Admins manage prompts" on public.prompts
  for all using (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  )
  with check (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  );

create policy "Admins read digest" on public.digest_runs
  for select using (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  );

create policy "Admins manage digest" on public.digest_runs
  for all using (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  )
  with check (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  );

create policy "Admins manage news" on public.news_items
  for all using (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  )
  with check (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  );

-- Trigger updated_at on subscribers/prompts
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_subscribers_updated_at
before update on public.subscribers
for each row execute procedure public.set_updated_at();

create trigger set_prompts_updated_at
before update on public.prompts
for each row execute procedure public.set_updated_at();
