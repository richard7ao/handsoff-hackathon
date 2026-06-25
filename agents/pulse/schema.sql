-- Pulse posts table — drafts queued by Scout, posted + monitored by Pulse.
-- Depends on scout_briefs (see scout/schema.sql). Run in the Supabase SQL editor.
create table if not exists public.scout_posts (
  id              bigint generated always as identity primary key,
  brief_id        bigint references public.scout_briefs(id),
  subreddit       text not null,
  title           text not null,
  body            text,
  status          text not null default 'draft',  -- draft|posted|rewritten|live|failed
  reddit_id       text,        -- t3_xxx fullname once posted
  permalink       text,
  upvotes         int  not null default 0,
  num_comments    int  not null default 0,
  score_threshold int  not null default 5,        -- below this => Pulse rewrites
  rewrites        int  not null default 0,
  max_rewrites    int  not null default 2,
  created_at      timestamptz not null default now(),
  posted_at       timestamptz,
  updated_at      timestamptz
);

create index if not exists scout_posts_status_idx on public.scout_posts (status);
