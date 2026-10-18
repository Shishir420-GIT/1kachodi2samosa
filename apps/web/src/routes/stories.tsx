import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, HeartHandshake, MessageSquareQuote, ShieldCheck } from 'lucide-react';
import type { Route } from './+types/stories';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

type Story = { id: string; title: string; body: string; topic: string; is_composite: boolean; ai_summary: string | null; friend_action: string | null };

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'Anonymous story wall — Dear Men', description: 'Read moderated, anonymous accounts and learn one practical way a friend could show up.' });
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [form, setForm] = useState({ title: '', body: '', topic: 'friends', consent_publication: false, website: '' });
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; fetch('/api/config').then(r => r.json()).then(config => {
    if (!config.supabase) return;
    const sb = createClient(config.supabase.url, config.supabase.key);
    return sb.from('stories').select('id,title,body,topic,is_composite,ai_summary,friend_action').order('published_at', { ascending: false });
  }).then(result => { if (active && result && !result.error) setStories(result.data || []); }).catch(() => {}); return () => { active = false; }; }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('');
    try { const response = await fetch('/api/stories', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Please try again.'); setForm({ title: '', body: '', topic: 'friends', consent_publication: false, website: '' }); setStatus('Thank you. Your story is in the human review queue; it is not public yet.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); }
  }
  return <><SiteHeader/><main className="app-page stories-page"><section className="page-intro"><p className="eyebrow">ANONYMOUS · MODERATED · PRACTICAL</p><h1>What happened.<br/><em>What a friend could do.</em></h1><p>Real patterns can help people recognise the moment sooner. Every submission is checked before it appears here.</p></section>
    <section className="story-promise"><div><ShieldCheck/><strong>No instant publishing</strong><span>Every story enters a human review queue.</span></div><div><MessageSquareQuote/><strong>No identifying details</strong><span>Leave out names, handles, workplaces and contact details.</span></div><div><HeartHandshake/><strong>One useful next move</strong><span>AI drafts a non-blaming support insight for review.</span></div></section>
    <section className="story-layout"><div className="story-feed"><p className="eyebrow">THE WALL</p>{stories.map(story => <article className="story-card" key={story.id}><div className="story-meta"><span>{story.topic}</span><span>{story.is_composite ? 'COMPOSITE EXAMPLE' : 'ANONYMOUS'}</span></div><h2>{story.title}</h2><p>{story.body}</p>{story.ai_summary && <div className="story-insight"><p className="eyebrow">THE PATTERN</p><p>{story.ai_summary}</p></div>}{story.friend_action && <div className="friend-action"><HeartHandshake size={21}/><div><p className="eyebrow">WHAT A FRIEND COULD DO</p><p>{story.friend_action}</p></div></div>}</article>)}{stories.length === 0 && <p className="empty-note">Published stories will appear here after review. Run the agentic MVP migration to load the two composite examples.</p>}</div>
      <aside className="story-submit paper-panel"><p className="eyebrow">LEAVE A STORY</p><h2>Say what you wish someone had noticed.</h2><p>Describe the moment and the support that was missing. Please remove anything that could identify a person.</p><form className="stack-form" onSubmit={submit}><label>Short title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} minLength={3} maxLength={100} required/></label><label>Closest topic<select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}><option value="friends">Friends</option><option value="workplace">Workplace</option><option value="boundaries">Boundaries</option><option value="bystander">Bystander</option><option value="relationships">Relationships</option><option value="other">Other</option></select></label><label>Your story<textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} minLength={40} maxLength={1800} rows={8} required/><small>{form.body.length}/1800</small></label><label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}/></label><label className="check-label"><input type="checkbox" checked={form.consent_publication} onChange={e => setForm({ ...form, consent_publication: e.target.checked })} required/> I consent to this edited, anonymous story being considered for public display.</label><button className="primary-link" disabled={busy}>{busy ? 'Sending for review…' : 'Send for review'} <ArrowRight size={17}/></button></form><p className="fine-print">This is not a crisis or reporting service. Do not submit an emergency, a name, contact information, or an allegation that identifies a private person.</p><p className="page-status" role="status">{status}</p></aside>
    </section></main><SiteFooter/></>;
}
