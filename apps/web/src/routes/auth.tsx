import { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { ArrowRight, Check, LockKeyhole, Users } from 'lucide-react';
import type { Route } from './+types/auth';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Sign in — Dear Men',
    description: 'Sign in with Google to keep your practice, reminders and accountability circles together, or continue as a guest.',
    noindex: true,
  });
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.35l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.63A10 10 0 0 0 12 22Z"/>
    <path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.44H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.56l3.35-2.63Z"/>
    <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.44l3.35 2.63C7.18 7.7 9.39 5.94 12 5.94Z"/>
  </svg>;
}

function safeNext(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export default function AuthPage() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState('');
  const next = useMemo(() => typeof window === 'undefined' ? '/dashboard' : safeNext(new URLSearchParams(window.location.search).get('next')), []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    fetch('/api/config').then(response => response.json()).then(config => {
      if (!active) return;
      if (!config.supabase) {
        setMessage('Account services are not configured yet. Guest practice is still available.');
        setLoading(false);
        return;
      }
      const sb = createClient(config.supabase.url, config.supabase.key);
      setClient(sb);
      const { data } = sb.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user && event === 'SIGNED_IN') window.setTimeout(() => window.location.replace(next), 0);
      });
      unsubscribe = () => data.subscription.unsubscribe();
      void sb.auth.getSession().then(({ data: sessionData }) => {
        if (!active) return;
        setUser(sessionData.session?.user ?? null);
        setLoading(false);
      });
    }).catch(() => {
      if (active) {
        setMessage('Could not connect to account services. Guest practice is still available.');
        setLoading(false);
      }
    });
    return () => { active = false; unsubscribe?.(); };
  }, [next]);

  async function signInWithGoogle() {
    if (!client || signingIn) return;
    setSigningIn(true);
    setMessage('Opening Google sign-in…');
    const redirectTo = `${window.location.origin}/auth?next=${encodeURIComponent(next)}`;
    const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) {
      setMessage(error.message);
      setSigningIn(false);
    }
  }

  return <><SiteHeader/><main className="auth-page">
    <section className="auth-editorial">
      <p className="eyebrow">YOUR PRACTICE, WHEN YOU WANT TO KEEP IT</p>
      <h1>Show up.<br/><em>Keep showing up.</em></h1>
      <p className="auth-lede">An account gives your small actions somewhere to add up. The practice itself stays open to everyone.</p>
      <div className="auth-benefits" aria-label="Account benefits">
        <div><Check size={18}/><span><strong>Remember your progress</strong> across devices</span></div>
        <div><Users size={18}/><span><strong>Share check-ins</strong> with a trusted circle</span></div>
        <div><LockKeyhole size={18}/><span><strong>Keep practice private</strong> from circle members</span></div>
      </div>
    </section>

    <section className="auth-card" aria-labelledby="auth-heading">
      <div className="auth-card-number">01</div>
      <p className="eyebrow">OPTIONAL ACCOUNT</p>
      <h2 id="auth-heading">{user ? 'You’re signed in.' : 'Open your path.'}</h2>
      <p>{user ? `Signed in as ${user.email ?? 'your Google account'}.` : 'Use Google to save progress, set daily reminders and join accountability circles.'}</p>
      {user ? <a className="google-auth-button" href={next}>Continue to my path <ArrowRight size={18}/></a> : <button className="google-auth-button" type="button" onClick={signInWithGoogle} disabled={!client || loading || signingIn}><GoogleMark/>{signingIn ? 'Connecting…' : 'Continue with Google'}</button>}
      <div className="auth-divider"><span>or</span></div>
      <a className="guest-button" href="/practice">Continue as guest <ArrowRight size={17}/></a>
      {user && <a className="auth-signout" href="/logout">Sign out on this device</a>}
      <p className="auth-privacy">Guest practice works without an account and stays on this browser. Google sign-in shares your name, email and profile image with Supabase authentication.</p>
      <p className="auth-message" role="status">{message}</p>
    </section>
  </main><SiteFooter/></>;
}
