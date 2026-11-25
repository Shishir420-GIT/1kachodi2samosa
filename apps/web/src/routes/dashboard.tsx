import { useCallback, useEffect, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { ArrowRight, Bell, Check, Copy, LogOut, ShieldCheck, Users } from 'lucide-react';
import type { Route } from './+types/dashboard';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

type Commitment = { id: string; action: string; created_at: string };
type PracticeEvent = { id: string; points: number; created_at: string };
type CircleMember = { user_id: string; display_name: string };
type CircleCheckin = { user_id: string; checkin_date: string; note: string | null };
type Circle = { id: string; name: string; invite_code: string; circle_members: CircleMember[]; circle_checkins: CircleCheckin[] };
type Reminder = { enabled: boolean; local_time: string; timezone: string };

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'My path — Dear Men', description: 'Keep a private practice record, choose a daily reminder, and share simple check-ins with people you trust.' });
}

const today = () => new Date().toISOString().slice(0, 10);
const milestone = (points: number) => points >= 12 ? ['Showing up', 12, 18] : points >= 7 ? ['Practising boundaries', 7, 12] : points >= 3 ? ['Reading the room', 3, 7] : ['Starting the practice', 0, 3];

export default function DashboardPage() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [events, setEvents] = useState<PracticeEvent[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [reminder, setReminder] = useState<Reminder>({ enabled: false, local_time: '09:00', timezone: 'Asia/Kolkata' });
  const [circleName, setCircleName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const refresh = useCallback(async (sb: SupabaseClient, activeUser: User) => {
    setLoading(true);
    const [actions, practice, prefs, circleRows] = await Promise.all([
      sb.from('commitments').select('id,action,created_at').order('created_at', { ascending: false }),
      sb.from('practice_events').select('id,points,created_at').order('created_at', { ascending: false }),
      sb.from('reminder_preferences').select('enabled,local_time,timezone').maybeSingle(),
      sb.from('accountability_circles').select('id,name,invite_code,circle_members(user_id,display_name),circle_checkins(user_id,checkin_date,note)').order('created_at', { ascending: false }),
    ]);
    if (actions.error || practice.error || prefs.error || circleRows.error) setMessage('Some account data is unavailable. Run the agentic MVP SQL migration, then refresh.');
    setCommitments(actions.data || []); setEvents(practice.data || []);
    if (prefs.data) setReminder({ ...prefs.data, local_time: prefs.data.local_time.slice(0, 5) });
    setCircles((circleRows.data || []) as unknown as Circle[]);
    setDisplayName(previous => previous || (activeUser.email?.split('@')[0] ?? ''));
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true; let unsubscribe: (() => void) | undefined;
    fetch('/api/config').then(r => r.json()).then(config => {
      if (!mounted) return;
      if (!config.supabase) { setMessage('Account features are not configured.'); setLoading(false); return; }
      const sb = createClient(config.supabase.url, config.supabase.key); setClient(sb);
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return; const nextUser = session?.user || null; setUser(nextUser);
        if (nextUser) void refresh(sb, nextUser); else setLoading(false);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }).catch(() => { if (mounted) { setMessage('Could not connect to account services.'); setLoading(false); } });
    return () => { mounted = false; unsubscribe?.(); };
  }, [refresh]);

  async function saveReminder(event: React.FormEvent) {
    event.preventDefault(); if (!client || !user) return;
    const row = { user_id: user.id, ...reminder, local_time: `${reminder.local_time}:00`, consented_at: reminder.enabled ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
    const { error } = await client.from('reminder_preferences').upsert(row);
    setMessage(error ? error.message : reminder.enabled ? 'Daily reminder preference saved.' : 'Daily reminders are off.');
  }
  async function createCircle(event: React.FormEvent) {
    event.preventDefault(); if (!client) return;
    const { error } = await client.rpc('create_circle', { circle_name: circleName, member_name: displayName });
    if (error) setMessage(error.message); else { setCircleName(''); setMessage('Circle created. Share its invite code with people you trust.'); if (user) await refresh(client, user); }
  }
  async function joinCircle(event: React.FormEvent) {
    event.preventDefault(); if (!client) return;
    const { error } = await client.rpc('join_circle', { code: inviteCode, member_name: displayName });
    if (error) setMessage(error.message); else { setInviteCode(''); setMessage('You joined the circle.'); if (user) await refresh(client, user); }
  }
  async function checkIn(circleId: string) {
    if (!client || !user) return;
    const { error } = await client.from('circle_checkins').insert({ circle_id: circleId, user_id: user.id, checkin_date: today(), note: 'I showed up for today’s practice.' });
    if (error) setMessage(error.message); else { setMessage('Today’s check-in is visible to this circle.'); await refresh(client, user); }
  }

  const points = events.reduce((sum, item) => sum + item.points, 0) + commitments.length;
  const [level, start, end] = milestone(points); const percent = Math.min(100, Math.round(((points - Number(start)) / (Number(end) - Number(start))) * 100));

  return <><SiteHeader/><main className="app-page">
    <section className="page-intro"><p className="eyebrow">YOUR PRIVATE PRACTICE</p><h1>Small actions.<br/><em>A visible pattern.</em></h1><p>Track the work without turning respect into a morality score. Share only simple check-ins with people you choose.</p></section>
    {!user ? <section className="auth-gate paper-panel"><ShieldCheck size={35}/><p className="eyebrow">PRIVATE BY DEFAULT · GOOGLE SIGN-IN</p><h2>Open your path.</h2><p>Sign in to keep progress, reminders and circle check-ins together. Practice remains available without an account.</p><a className="primary-link" href="/auth?next=/dashboard">Choose how to continue <ArrowRight size={17}/></a></section> : <>
      <section className="progress-hero paper-panel"><div><p className="eyebrow">CURRENT MILESTONE</p><h2>{level}</h2><p>{points} practice points · {commitments.length} saved action{commitments.length === 1 ? '' : 's'}</p></div><div className="progress-ring" style={{ '--progress': `${percent * 3.6}deg` } as React.CSSProperties}><span>{percent}%</span></div></section>
      <div className="dashboard-grid">
        <section className="paper-panel"><Bell/><p className="eyebrow">A GENTLE NUDGE</p><h2>Daily reminder</h2><form className="stack-form" onSubmit={saveReminder}><label className="check-label"><input type="checkbox" checked={reminder.enabled} onChange={e => setReminder({ ...reminder, enabled: e.target.checked })}/> Send me one daily practice reminder</label><label>Local time<input type="time" value={reminder.local_time} onChange={e => setReminder({ ...reminder, local_time: e.target.value })}/></label><label>Timezone<input value={reminder.timezone} onChange={e => setReminder({ ...reminder, timezone: e.target.value })} maxLength={64}/></label><button className="text-link">Save reminder <ArrowRight size={16}/></button></form><p className="fine-print">You can turn this off anytime. The scheduled sender will begin after the email domain is verified.</p></section>
        <section className="paper-panel"><Users/><p className="eyebrow">ACCOUNTABILITY, WITH BOUNDARIES</p><h2>Your circles</h2><p>Members see names and daily check-ins. They never see your practice text or private takeaways.</p><label className="shared-name">Your circle name<input value={displayName} onChange={e => setDisplayName(e.target.value)} minLength={2} maxLength={40}/></label><div className="circle-actions"><form onSubmit={createCircle}><label>Start a circle<input value={circleName} onChange={e => setCircleName(e.target.value)} placeholder="Sunday check-in" minLength={2} maxLength={50} required/></label><button className="text-link">Create <ArrowRight size={16}/></button></form><form onSubmit={joinCircle}><label>Join with a code<input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="AB12CD34" required/></label><button className="text-link">Join <ArrowRight size={16}/></button></form></div></section>
      </div>
      <section className="circle-list">{circles.map(circle => { const checked = circle.circle_checkins?.some(c => c.user_id === user.id && c.checkin_date === today()); return <article className="circle-card" key={circle.id}><div><p className="eyebrow">{circle.circle_members?.length || 1} MEMBER{circle.circle_members?.length === 1 ? '' : 'S'}</p><h3>{circle.name}</h3><p>{circle.circle_members?.map(m => m.display_name).join(' · ')}</p></div><div className="invite-code"><span>INVITE CODE</span><strong>{circle.invite_code}</strong><button aria-label="Copy invite code" onClick={() => { void navigator.clipboard.writeText(circle.invite_code); setMessage('Invite code copied.'); }}><Copy size={16}/></button></div><button className="primary-link" disabled={checked} onClick={() => checkIn(circle.id)}>{checked ? <><Check size={17}/> Checked in today</> : <>Check in today <ArrowRight size={17}/></>}</button></article>; })}{!loading && circles.length === 0 && <p className="empty-note">Create a circle for two or more people, or join one with an invite code.</p>}</section>
      <a className="text-link sign-out" href="/logout"><LogOut size={16}/> Sign out</a>
    </>}
    {loading && <p className="page-status">Loading your path…</p>}<p className="page-status" role="status">{message}</p>
  </main><SiteFooter/></>;
}
