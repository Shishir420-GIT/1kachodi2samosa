import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, LogOut } from 'lucide-react';
import type { Route } from './+types/logout';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'Sign out — Dear Men', description: 'End your Dear Men account session on this browser.', noindex: true });
}

export default function LogoutPage() {
  const [status, setStatus] = useState('Signing you out…');
  useEffect(() => { let active = true; fetch('/api/config').then(r => r.json()).then(async config => {
    if (config.supabase) await createClient(config.supabase.url, config.supabase.key).auth.signOut();
    try { localStorage.removeItem('dearmen-actions-v1'); } catch { /* Storage may be unavailable. */ }
    if (active) setStatus('You’re signed out.');
  }).catch(() => { if (active) setStatus('Your local session could not be confirmed. Close this browser on a shared device.'); }); return () => { active = false; }; }, []);
  return <><SiteHeader/><main className="app-page logout-page"><section className="paper-panel logout-card"><LogOut size={35}/><p className="eyebrow">SESSION ENDED</p><h1>{status}</h1><p>Your account session and locally saved practice takeaways have been cleared from this browser.</p><div className="logout-actions"><a className="primary-link" href="/auth?next=/dashboard">Sign in again <ArrowRight size={17}/></a><a className="text-link" href="/practice">Continue as a guest <ArrowRight size={17}/></a></div></section></main><SiteFooter/></>;
}
