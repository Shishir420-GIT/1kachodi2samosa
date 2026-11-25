import { useEffect, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Eye, ScanSearch, ShieldCheck } from 'lucide-react';
import type { Route } from './+types/ai';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

type Health = { ok: boolean; ai_provider_status?: string; ai_provider_error?: string | null; model?: string; adk?: string; model_calls_today?: number; daily_model_call_limit?: number };

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'How the AI works — Dear Men', description: 'See the bounded Google ADK agents, privacy checks, human review boundary and current provider status behind Dear Men.' });
}

const agents = [
  { icon: Bot, name: 'Response coach', text: 'Reviews the words you try and returns structured, behavior-focused coaching.' },
  { icon: Eye, name: 'Practice partner', text: 'Produces one short fictional reply so you can practise a second attempt.' },
  { icon: ScanSearch, name: 'Story privacy guard', text: 'Removes names and contextual identifiers before any story is stored.' },
  { icon: ShieldCheck, name: 'Support insight writer', text: 'Receives only sanitized text and drafts one practical friend action for human review.' },
];

export default function AiPage() {
  const [health, setHealth] = useState<Health | null>(null);
  useEffect(() => { let active = true; fetch('/api/health').then(r => r.json()).then(data => { if (active) setHealth(data); }).catch(() => { if (active) setHealth({ ok: false }); }); return () => { active = false; }; }, []);
  const live = health?.ai_provider_status === 'verified';
  const configured = health?.ai_provider_status === 'configured';
  const status = live ? 'Live call verified' : configured ? 'Configured · awaiting a successful call' : health?.ai_provider_status === 'degraded' ? 'Provider degraded · safe fallback active' : health ? 'Scripted demo mode' : 'Checking provider…';
  return <><SiteHeader/><main className="app-page ai-page"><section className="page-intro"><p className="eyebrow">VISIBLE AGENTS · BOUNDED CALLS · HUMAN REVIEW</p><h1>The AI should be<br/><em>inspectable too.</em></h1><p>Google ADK coordinates four narrow agents. Structured schemas, local checks and a human publication queue keep them inside clear boundaries.</p></section>
    <section className={`ai-status ${live ? 'is-live' : ''}`}><div><span className="status-dot"/><p className="eyebrow">CURRENT RUNTIME</p><h2>{status}</h2></div><dl><div><dt>Framework</dt><dd>Google ADK {health?.adk ?? '2.9.0'}</dd></div><div><dt>Model</dt><dd>{health?.model ?? 'Loading…'}</dd></div><div><dt>Process budget</dt><dd>{health ? `${health.model_calls_today ?? 0} / ${health.daily_model_call_limit ?? 100} calls today` : 'Loading…'}</dd></div></dl>{health?.ai_provider_error && <p className="ai-runtime-note">The app is serving clearly labelled scripted guidance because the provider reported <strong>{health.ai_provider_error.replaceAll('_', ' ')}</strong>. No fallback is presented as Gemini output.</p>}</section>
    <section className="agent-grid" aria-label="AI agent workflow">{agents.map(({ icon: Icon, name, text }, index) => <article className="agent-card" key={name}><span>0{index + 1}</span><Icon size={26}/><h2>{name}</h2><p>{text}</p></article>)}</section>
    <section className="ai-boundary paper-panel"><CheckCircle2 size={30}/><div><p className="eyebrow">THE PUBLICATION BOUNDARY</p><h2>AI never publishes a story.</h2><p>Obvious contacts are removed locally first. The privacy agent generalizes contextual identifiers. A second local scrub runs afterward. Only the sanitized text reaches the insight writer and database, and a human must still approve publication.</p><a className="primary-link" href="/practice">Run a real practice check <ArrowRight size={17}/></a></div></section>
  </main><SiteFooter/></>;
}
