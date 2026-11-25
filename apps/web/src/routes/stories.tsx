import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, HeartHandshake, ScanSearch, ShieldCheck } from 'lucide-react';
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
  const [status, setStatus] = useState(''); const [workflow, setWorkflow] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; fetch('/api/config').then(r => r.json()).then(config => {
    if (!config.supabase) return;
    const sb = createClient(config.supabase.url, config.supabase.key);
    return sb.from('stories').select('id,title,body,topic,is_composite,ai_summary,friend_action').order('published_at', { ascending: false });
  }).then(result => { if (active && result && !result.error) setStories(result.data || []); }).catch(() => {}); return () => { active = false; }; }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setStatus(''); setWorkflow([]);
    try { const response = await fetch('/api/stories', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Please try again.'); setForm({ title: '', body: '', topic: 'friends', consent_publication: false, website: '' }); setWorkflow(data.workflow || []); setStatus(data.privacy?.pii_removed ? 'Identifiers were removed. Your sanitized story is now in the human review queue.' : 'No identifiers were detected. Your story is now in the human review queue.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); }
  }
  return <><SiteHeader/><main className="app-page stories-page"><section className="page-intro"><p className="eyebrow">ANONYMOUS · MODERATED · PRACTICAL</p><h1>What happened.<br/><em>What a friend could do.</em></h1><p>Real patterns can help people recognise the moment sooner. Every submission is checked before it appears here.</p></section>
    <section className="story-promise"><div><ShieldCheck/><strong>No instant publishing</strong><span>Every story enters a human review queue.</span></div><div><ScanSearch/><strong>AI privacy scrub</strong><span>Gemini removes names and contextual identifiers before storage.</span></div><div><HeartHandshake/><strong>Sanitized insight</strong><span>A separate agent sees only redacted text and drafts one useful next move.</span></div></section>
    <section className="story-layout"><div className="story-feed"><p className="eyebrow">THE WALL</p>{stories.map(story => <article className="story-card" key={story.id}><div className="story-meta"><span>{story.topic}</span><span>{story.is_composite ? 'COMPOSITE EXAMPLE' : 'ANONYMOUS'}</span></div><h2>{story.title}</h2><p>{story.body}</p>{story.ai_summary && <div className="story-insight"><p className="eyebrow">THE PATTERN</p><p>{story.ai_summary}</p></div>}{story.friend_action && <div className="friend-action"><HeartHandshake size={21}/><div><p className="eyebrow">WHAT A FRIEND COULD DO</p><p>{story.friend_action}</p></div></div>}</article>)}{stories.length === 0 && <p className="empty-note">Published stories will appear here after review. Run the agentic MVP migration to load the two composite examples.</p>}</div>
      <aside className="story-submit paper-panel"><p className="eyebrow">LEAVE A STORY</p><h2>Say what you wish someone had noticed.</h2><p>Describe the moment and the support that was missing. Remove identifiers yourself when you can; the privacy pipeline checks again before storage.</p><form className="stack-form" onSubmit={submit}><label>Short title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} minLength={3} maxLength={100} required/></label><label>Closest topic<select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}><option value="friends">Friends</option><option value="workplace">Workplace</option><option value="boundaries">Boundaries</option><option value="bystander">Bystander</option><option value="relationships">Relationships</option><option value="other">Other</option></select></label><label>Your story<textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} minLength={40} maxLength={1800} rows={8} required/><small>{form.body.length}/1800</small></label><label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}/></label><label className="check-label"><input type="checkbox" checked={form.consent_publication} onChange={e => setForm({ ...form, consent_publication: e.target.checked })} required/> I consent to the sanitized, edited story being considered for public display.</label><button className="primary-link" disabled={busy}>{busy ? 'Running privacy checks…' : 'Sanitize and send for review'} <ArrowRight size={17}/></button></form><p className="fine-print">Raw text is sent to the privacy guard but is never stored. AI can miss context, so a human must still approve every publication. This is not a crisis or reporting service.</p>{workflow.length > 0 && <ol className="story-workflow" aria-label="Completed checks">{workflow.map(item => <li key={item}>{item}</li>)}</ol>}<p className="page-status" role="status">{status}</p></aside>
    </section></main><SiteFooter/></>;
}
