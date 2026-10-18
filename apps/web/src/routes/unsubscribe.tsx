import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { BellOff } from 'lucide-react';
import type { Route } from './+types/unsubscribe';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'Unsubscribe — Dear Men', description: 'Turn off daily Dear Men practice reminders.' });
}

export default function UnsubscribePage() {
  const [params] = useSearchParams(); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false); const token = params.get('token') || '';
  async function unsubscribe() { setBusy(true); setStatus(''); try { const response = await fetch('/api/unsubscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Please try again.'); setStatus('Daily reminders are now off.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); } }
  return <><SiteHeader/><main className="app-page"><section className="auth-gate paper-panel unsubscribe-card"><BellOff size={36}/><p className="eyebrow">EMAIL PREFERENCES</p><h1>Turn off daily reminders?</h1><p>You can enable them again from My path after signing in.</p><button className="primary-link" onClick={unsubscribe} disabled={busy || !token}>{busy ? 'Turning reminders off…' : 'Turn reminders off'}</button>{!token && <p className="page-status">This link is missing its unsubscribe token.</p>}<p className="page-status" role="status">{status}</p></section></main><SiteFooter/></>;
}
