-- 1. Pipelines table
create table if not exists public.pipelines (
  id serial primary key,
  name text not null,
  purpose text not null check (purpose in ('ai-nyheter', 'opplaering', 'alerts', 'generelle-nyheter')),
  config jsonb not null default '{}'::jsonb,
  template_config jsonb not null default '{}'::jsonb,
  schedule_cron text default '0 6 * * *',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Content sources table
create table if not exists public.content_sources (
  id serial primary key,
  name text not null,
  type text not null check (type in ('rss', 'scraping', 'api', 'manual')),
  base_url text,
  config jsonb not null default '{}'::jsonb,
  category text,
  priority integer default 5,
  active boolean default true,
  last_successful_fetch timestamptz,
  consecutive_failures integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pipeline_sources (
  id serial primary key,
  pipeline_id integer references public.pipelines(id) on delete cascade,
  source_id integer references public.content_sources(id) on delete cascade,
  priority integer default 5,
  processor_config jsonb default '{}'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  unique (pipeline_id, source_id)
);

-- 4. Rename news_items → content_items and extend schema
alter table if exists public.news_items rename to content_items;

alter index if exists news_items_url_idx rename to content_items_url_idx;
alter index if exists news_items_published_idx rename to content_items_published_idx;

alter table if exists public.content_items
  add column if not exists source_id integer references public.content_sources(id),
  add column if not exists pipeline_id integer references public.pipelines(id),
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists relevance_score numeric,
  add column if not exists processed_at timestamptz,
  add column if not exists content_type text default 'article';

create index if not exists idx_content_items_pipeline_published on public.content_items(pipeline_id, published_at desc);
create index if not exists idx_content_items_source_processed on public.content_items(source_id, processed_at desc);

-- 5. Error logging table
create table if not exists public.error_logs (
  id serial primary key,
  pipeline_id integer references public.pipelines(id),
  source_id integer references public.content_sources(id),
  error_type text not null,
  error_message text not null,
  phase text not null check (phase in ('fetching', 'processing', 'generation', 'dispatch')),
  context jsonb default '{}'::jsonb,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- 6. Digest analytics table
create table if not exists public.digest_analytics (
  id serial primary key,
  digest_run_id uuid references public.digest_runs(id) on delete cascade,
  pipeline_id integer references public.pipelines(id),
  articles_processed integer default 0,
  sources_checked integer default 0,
  sources_failed integer default 0,
  generation_time_ms integer default 0,
  recipients_sent integer default 0,
  open_rate numeric,
  click_rate numeric,
  created_at timestamptz default now()
);

create index if not exists idx_error_logs_pipeline_created on public.error_logs(pipeline_id, created_at desc);
create index if not exists idx_digest_analytics_digest on public.digest_analytics(digest_run_id);

-- 7. Enable RLS for new tables
alter table if exists public.pipelines enable row level security;
alter table if exists public.content_sources enable row level security;
alter table if exists public.pipeline_sources enable row level security;
alter table if exists public.error_logs enable row level security;
alter table if exists public.digest_analytics enable row level security;

-- 8. updated_at triggers (re-use set_updated_at function)
do
$$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    if not exists (select 1 from pg_trigger where tgname = 'set_pipelines_updated_at') then
      create trigger set_pipelines_updated_at
        before update on public.pipelines
        for each row execute procedure public.set_updated_at();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'set_content_sources_updated_at') then
      create trigger set_content_sources_updated_at
        before update on public.content_sources
        for each row execute procedure public.set_updated_at();
    end if;
  end if;
end
$$;

-- 9. Admin RLS policies
DO
$$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pipelines' and policyname = 'Admins manage pipelines'
  ) then
    create policy "Admins manage pipelines" on public.pipelines
      for all using (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin')
      with check (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'content_sources' and policyname = 'Admins manage content_sources'
  ) then
    create policy "Admins manage content_sources" on public.content_sources
      for all using (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin')
      with check (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pipeline_sources' and policyname = 'Admins manage pipeline_sources'
  ) then
    create policy "Admins manage pipeline_sources" on public.pipeline_sources
      for all using (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin')
      with check (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'error_logs' and policyname = 'Admins manage error_logs'
  ) then
    create policy "Admins manage error_logs" on public.error_logs
      for all using (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin')
      with check (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'digest_analytics' and policyname = 'Admins manage digest_analytics'
  ) then
    create policy "Admins manage digest_analytics" on public.digest_analytics
      for all using (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin')
      with check (auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin');
  end if;
end
$$;
