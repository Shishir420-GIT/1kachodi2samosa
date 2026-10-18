-- Agentic MVP migration. Run after schema.sql in the Supabase SQL editor.
-- Safe to run more than once.

create table if not exists public.practice_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario text not null check (scenario in ('joke','boundary','bystander')),
  event_type text not null check (event_type in ('first_attempt','retry','helper','daily_checkin')),
  points smallint not null default 1 check (points between 0 and 5),
  created_at timestamptz not null default now()
);
alter table public.practice_events enable row level security;
grant select, insert on public.practice_events to authenticated;
revoke all on public.practice_events from anon;
drop policy if exists "Read own practice events" on public.practice_events;
drop policy if exists "Create own practice events" on public.practice_events;
create policy "Read own practice events" on public.practice_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own practice events" on public.practice_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
create index if not exists practice_events_owner_date
  on public.practice_events(user_id, created_at desc);

create table if not exists public.accountability_circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 50),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id uuid not null references public.accountability_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table if not exists public.circle_checkins (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.accountability_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  note text check (note is null or char_length(note) <= 120),
  created_at timestamptz not null default now(),
  unique (circle_id, user_id, checkin_date)
);

alter table public.accountability_circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_checkins enable row level security;
grant select on public.accountability_circles, public.circle_members, public.circle_checkins to authenticated;
grant insert on public.circle_checkins to authenticated;
revoke all on public.accountability_circles, public.circle_members, public.circle_checkins from anon;

create or replace function public.is_circle_member(target_circle uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.circle_members m
    where m.circle_id = target_circle and m.user_id = auth.uid()
  );
$$;
revoke all on function public.is_circle_member(uuid) from public;
grant execute on function public.is_circle_member(uuid) to authenticated;

drop policy if exists "Members read circles" on public.accountability_circles;
drop policy if exists "Members read memberships" on public.circle_members;
drop policy if exists "Members read circle checkins" on public.circle_checkins;
drop policy if exists "Members create own circle checkins" on public.circle_checkins;
create policy "Members read circles" on public.accountability_circles
  for select to authenticated using (public.is_circle_member(id));
create policy "Members read memberships" on public.circle_members
  for select to authenticated using (public.is_circle_member(circle_id));
create policy "Members read circle checkins" on public.circle_checkins
  for select to authenticated using (public.is_circle_member(circle_id));
create policy "Members create own circle checkins" on public.circle_checkins
  for insert to authenticated with check (
    user_id = (select auth.uid()) and public.is_circle_member(circle_id)
  );

create or replace function public.create_circle(circle_name text, member_name text)
returns table(id uuid, name text, invite_code text)
language plpgsql security definer set search_path = public
as $$
declare new_circle public.accountability_circles;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(circle_name)) < 2 or char_length(trim(circle_name)) > 50 then raise exception 'Circle name must be 2–50 characters'; end if;
  if char_length(trim(member_name)) < 2 or char_length(trim(member_name)) > 40 then raise exception 'Display name must be 2–40 characters'; end if;
  insert into public.accountability_circles(owner_id, name)
    values (auth.uid(), trim(circle_name)) returning * into new_circle;
  insert into public.circle_members(circle_id, user_id, display_name)
    values (new_circle.id, auth.uid(), trim(member_name));
  return query select new_circle.id, new_circle.name, new_circle.invite_code;
end;
$$;

create or replace function public.join_circle(code text, member_name text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare target_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(member_name)) < 2 or char_length(trim(member_name)) > 40 then raise exception 'Display name must be 2–40 characters'; end if;
  select c.id into target_id from public.accountability_circles c where c.invite_code = upper(trim(code));
  if target_id is null then raise exception 'Invite code not found'; end if;
  insert into public.circle_members(circle_id, user_id, display_name)
    values (target_id, auth.uid(), trim(member_name)) on conflict do nothing;
  return target_id;
end;
$$;
revoke all on function public.create_circle(text,text) from public;
revoke all on function public.join_circle(text,text) from public;
grant execute on function public.create_circle(text,text), public.join_circle(text,text) to authenticated;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 100),
  body text not null check (char_length(body) between 40 and 1800),
  topic text not null default 'other' check (topic in ('friends','workplace','boundaries','bystander','relationships','other')),
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  is_composite boolean not null default false,
  consent_publication boolean not null default false,
  ai_summary text check (ai_summary is null or char_length(ai_summary) <= 500),
  friend_action text check (friend_action is null or char_length(friend_action) <= 500),
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
alter table public.stories enable row level security;
grant select on public.stories to anon, authenticated;
revoke insert, update, delete on public.stories from anon, authenticated;
drop policy if exists "Anyone reads published stories" on public.stories;
create policy "Anyone reads published stories" on public.stories
  for select using (status = 'published' and consent_publication = true);

-- Reviewed composite examples make the public wall useful before submissions are approved.
insert into public.stories(id, title, body, topic, status, is_composite, consent_publication, ai_summary, friend_action, published_at)
values
  ('00000000-0000-4000-8000-000000000101', 'The joke everyone let pass',
   'A group of friends kept making comments about a woman who was not there. One person noticed I had gone quiet, but he changed the subject instead of naming what was happening. I remember wishing someone had simply said that the joke was not okay.',
   'friends', 'published', true, true,
   'Silence in a group can make harmful behaviour feel accepted, even when some people are uncomfortable.',
   'A friend could set a calm boundary: “Let’s not make her the punchline.” Check in privately afterward without asking the affected person to educate the group.', now()),
  ('00000000-0000-4000-8000-000000000102', 'He kept asking after I said no',
   'I turned down a date and he continued messaging through different apps. A mutual friend knew, but treated it like persistence was romantic. What I needed was for that friend to tell him the answer had already been given.',
   'boundaries', 'published', true, true,
   'Repeated contact after a clear rejection can turn pressure into a group-enabled pattern.',
   'A friend could say: “She already answered. Do not contact her again.” Avoid carrying messages or helping someone find another route around a boundary.', now())
on conflict (id) do nothing;

create index if not exists stories_publication_date on public.stories(status, published_at desc);
