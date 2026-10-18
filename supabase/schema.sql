-- Run once in the Supabase SQL editor. No service-role key is needed by the app.
create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario text not null check (scenario in ('joke','boundary','bystander')),
  action text not null check (char_length(action) between 1 and 300),
  created_at timestamptz not null default now()
);
alter table public.commitments enable row level security;
grant select, insert, delete on public.commitments to authenticated;
revoke all on public.commitments from anon;
create policy "Read own commitments" on public.commitments for select to authenticated using ((select auth.uid()) = user_id);
create policy "Save own commitments" on public.commitments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own commitments" on public.commitments for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists commitments_owner_date on public.commitments(user_id, created_at desc);

-- Optional daily-reminder preferences. The address itself remains in auth.users;
-- application tables store only delivery preferences and consent state.
create table if not exists public.reminder_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  local_time time not null default '09:00',
  timezone text not null default 'Asia/Kolkata'
    check (char_length(timezone) between 1 and 64),
  consented_at timestamptz,
  last_sent_at timestamptz,
  updated_at timestamptz not null default now(),
  check (not enabled or consented_at is not null)
);
alter table public.reminder_preferences enable row level security;
grant select, insert, update, delete on public.reminder_preferences to authenticated;
revoke all on public.reminder_preferences from anon;
create policy "Read own reminder preference" on public.reminder_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own reminder preference" on public.reminder_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own reminder preference" on public.reminder_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own reminder preference" on public.reminder_preferences
  for delete to authenticated using ((select auth.uid()) = user_id);
