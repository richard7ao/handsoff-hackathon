-- Scout default landing table. Run in the Supabase SQL editor (Person A owns
-- the Supabase project). Safe to re-run.
create table if not exists public.scout_findings (
  id           bigint generated always as identity primary key,
  source       text not null,
  title        text,
  url          text,
  content      text,
  metadata     jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now()
);

-- De-dupe the same url from the same source (optional but handy for scouts).
create unique index if not exists scout_findings_source_url_uniq
  on public.scout_findings (source, url)
  where url is not null;

create index if not exists scout_findings_collected_at_idx
  on public.scout_findings (collected_at desc);
