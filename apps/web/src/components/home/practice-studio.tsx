import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, RotateCcw, Bookmark, Check, ShieldCheck, MessageCircle, BookOpen } from 'lucide-react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const scenes = [
  { id: 'joke', tag: 'FRIENDS & GROUP CHATS', title: '“It’s just a joke.”', context: 'Your friend makes a sexist joke in the group chat. Someone goes quiet. You decide to say something.', opening: 'Come on, everyone laughed. Why are you making it a thing?', starter: 'We can be funny without making her the punchline.' },
  { id: 'boundary', tag: 'CONSENT & BOUNDARIES', title: 'No. Not “convince me”.', context: 'A friend wants to keep messaging a woman who has already said no. He asks you to help change her mind.', opening: 'What if I send just one more message? She might change her mind.', starter: 'She has already said no. Let’s respect that and leave her alone.' },
  { id: 'bystander', tag: 'SAFE BYSTANDER ACTION', title: '“Someone should help.”', context: 'At a café, someone is repeatedly bothering a woman trying to leave. You and a friend consider how to offer help safely.', opening: 'Should we go over and confront him?', starter: 'Let’s ask a member of staff to help, and check what she wants if it’s safe.' },
] as const;
type Result = { mode: 'live' | 'demo' | 'fallback' | 'safety'; character: string; coaching: { observation: string; try_instead: string; why: string; next_action: string; stop_practice: boolean }; source: { title: string; url: string }; workflow: string[]; model: string | null };
type Turn = { role: 'user' | 'character'; text: string };
type Saved = { id: string; scenario: string; action: string; created_at: string };
const STORAGE = 'dearmen-actions-v1';

export function PracticeStudio() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<'practice' | 'helper'>('practice');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Turn[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [aiMode, setAiMode] = useState('loading');
  const [saved, setSaved] = useState<Saved[]>([]);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [authNote, setAuthNote] = useState('');
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [saveNote, setSaveNote] = useState('');
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const scene = scenes[selected];
  const result = results.at(-1);
  const complete = results.length >= 2 || result?.coaching.stop_practice;

  useEffect(() => {
    let active = true; let unsubscribe: (() => void) | undefined;
    try { const items = JSON.parse(localStorage.getItem(STORAGE) || '[]'); if (Array.isArray(items)) setSaved(items.filter(x => typeof x.action === 'string' && typeof x.id === 'string').slice(0, 30)); } catch { /* Storage may be unavailable in private mode. */ }
    fetch('/api/config').then(r => r.json()).then(config => {
      if (!active) return;
      setAiMode(config.aiMode);
      if (config.supabase) {
        const sb = createClient(config.supabase.url, config.supabase.key);
        setClient(sb);
        const { data } = sb.auth.onAuthStateChange((_event, session) => { if (active) setUserId(session?.user.id || null); });
        unsubscribe = () => data.subscription.unsubscribe();
      }
    }).catch(() => { if (active) setAiMode('unknown'); });
    return () => { active = false; unsubscribe?.(); };
  }, []);
  useEffect(() => {
    if (!client || !userId) return;
    let active = true;
    client.from('commitments').select('id,scenario,action,created_at').order('created_at', { ascending: false }).limit(30).then(({ data, error }) => {
      if (!active) return;
      if (error) { setAuthNote('Signed in. Cloud progress is unavailable; check database setup.'); return; }
      setSaved(previous => [...new Map([...(data || []), ...previous].map(x => [x.id, x])).values()].slice(0, 30));
    });
    return () => { active = false; };
  }, [client, userId]);

  function reset(index = selected, nextMode = mode) {
    setSelected(index); setMode(nextMode); setMessage(''); setHistory([]); setResults([]); setError(''); setUrgent(false); setSaveNote('');
  }
  async function respond(event: React.FormEvent) {
    event.preventDefault(); if (busy || message.trim().length < 3) return;
    setBusy(true); setError(''); setSaveNote('');
    try {
      const response = await fetch('/api/practice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: scene.id, mode, message: message.trim(), history, urgent }), signal: AbortSignal.timeout(45000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      setResults(previous => [...previous, data]);
      setHistory(previous => [...previous, { role: 'user', text: message.trim() }, ...(data.character ? [{ role: 'character' as const, text: data.character }] : [])]);
      if (client && userId && !data.coaching.stop_practice) {
        const event_type = mode === 'helper' ? 'helper' : results.length ? 'retry' : 'first_attempt';
        void client.from('practice_events').insert({ user_id: userId, scenario: scene.id, event_type, points: event_type === 'helper' ? 1 : 2 });
      }
      setMessage('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function saveAction() {
    if (!result || saveNote.startsWith('Saved')) return;
    const item: Saved = { id: crypto.randomUUID(), scenario: scene.id, action: result.coaching.next_action, created_at: new Date().toISOString() };
    const next = [item, ...saved].slice(0, 30); setSaved(next);
    let local = true;
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { local = false; }
    if (client && userId) {
      const { error } = await client.from('commitments').insert({ ...item, user_id: userId });
      setSaveNote(error ? (local ? 'Saved on this device. Cloud sync failed.' : 'Cloud sync failed; this takeaway will last only for this visit.') : 'Saved to your account.');
    } else setSaveNote(local ? 'Saved on this device.' : 'Saved for this visit only; browser storage is unavailable.');
  }
  async function signIn(event: React.FormEvent) {
    event.preventDefault(); if (!client) return;
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/#practice' } });
    setAuthNote(error ? error.message : 'Check your email for a sign-in link.');
  }
  async function clearSaved() {
    if (client && userId) {
      const { error } = await client.from('commitments').delete().eq('user_id', userId);
      if (error) { setSaveNote('Could not clear cloud takeaways. Please try again.'); return; }
    }
    setSaved([]); try { localStorage.removeItem(STORAGE); } catch { /* Session state is still cleared. */ }
    setSaveNote('Saved takeaways cleared.');
  }
  return <section className="practice-studio section-rail" id="practice" aria-labelledby="practice-title">
    <span className="vertical-label">SMALL WORDS. REAL RESPONSIBILITY.</span>
    <div className="section-heading"><div><p className="eyebrow">04 / PUT IT INTO WORDS</p><h2 id="practice-title">Good intentions.<br/><em>Now say something.</em></h2></div><p>A little practice for the<br/>moments that matter.</p></div>
    <div className="studio-topline"><span className="studio-status"><span className="status-dot"/>{aiMode === 'live' ? 'AI practice enabled' : aiMode === 'demo' ? 'Scripted preview · AI not connected' : aiMode === 'loading' ? 'Connecting to the studio…' : 'Connection unavailable'}</span><span>ENGLISH · ABOUT 3 MINUTES · NO ACCOUNT NEEDED</span></div>
    <div className="studio-tabs" aria-label="Choose an experience"><button disabled={busy} aria-pressed={mode === 'practice'} onClick={() => reset(selected, 'practice')}><MessageCircle size={18}/> Practise a conversation</button><button disabled={busy} aria-pressed={mode === 'helper'} onClick={() => reset(selected, 'helper')}><BookOpen size={18}/> Help me respond</button></div>
    <div className="studio-grid">
      <aside className="scenario-shelf"><p className="eyebrow">CHOOSE YOUR MOMENT</p>{scenes.map((s, i) => <button key={s.id} disabled={busy} className={`scenario-card ${selected === i ? 'selected' : ''}`} aria-pressed={selected === i} onClick={() => reset(i)}><span className="scenario-number">0{i + 1}</span><span><small>{s.tag}</small><strong>{s.title}</strong></span><ArrowUpRight size={20}/></button>)}<div className="studio-principle"><ShieldCheck size={24}/><p>Practice, not a personality test. No virtue scores. No medals for basic respect.</p></div></aside>
      <div className="conversation-panel">
        <div className="quiz-meta"><span>{mode === 'practice' ? 'YOUR PRACTICE ROOM' : 'A LITTLE HELP FINDING THE WORDS'}</span><span>{Math.min(results.length + 1, 2)} / 2</span></div>
        <h3>{mode === 'practice' ? scene.title : 'What’s the situation?'}</h3>
        <p className="scene-context">{mode === 'practice' ? scene.context : 'Describe what happened and what you want to say. Leave out names, contact details and identifying information. Choose the closest topic on the left.'}</p>
        {mode === 'practice' && <div className="character-line"><small>YOUR FRIEND · FICTIONAL SCENARIO</small><p>“{scene.opening}”</p></div>}
        {history.length > 0 && <div className="conversation-history" aria-label="Practice transcript">{history.map((t, i) => <div key={i} className={`transcript-line ${t.role}`}><small>{t.role === 'user' ? 'YOU' : 'YOUR FRIEND · SIMULATED'}</small><p>{t.text}</p></div>)}</div>}
        {result && <div className="coaching-card" aria-live="polite"><p className="eyebrow">{result.mode === 'live' ? 'A MOMENT TO REFLECT' : result.mode === 'safety' ? 'SAFETY COMES FIRST' : result.mode === 'fallback' ? 'AI UNAVAILABLE · SCRIPTED EXAMPLE' : 'SCRIPTED EXAMPLE · NOT PERSONALISED FEEDBACK'}</p><p>{result.coaching.observation}</p><h4>Words you could use</h4><blockquote>{result.coaching.try_instead}</blockquote><p>{result.coaching.why}</p><a className="text-link" href={result.source.url} target="_blank" rel="noreferrer">{result.source.title}<ArrowUpRight size={15}/></a>{results.length > 1 && <details><summary>Compare with your first attempt</summary><p>{history.find(t => t.role === 'user')?.text}</p><p><strong>Earlier suggestion:</strong> {results[0].coaching.try_instead}</p></details>}</div>}
        {!complete ? <form onSubmit={respond} className="practice-form"><label htmlFor="practice-response">{result ? 'Try it again, in your own words.' : mode === 'practice' ? 'What would you say?' : 'Describe the moment.'}</label><textarea ref={replyRef} id="practice-response" value={message} onChange={e => setMessage(e.target.value)} minLength={3} maxLength={1200} required disabled={busy} placeholder={mode === 'practice' ? 'Start with one honest sentence…' : 'For example: a friend keeps dismissing a colleague in meetings…'} rows={4}/><div className="input-meta"><span>Keep it anonymous. Raw conversations aren’t saved.</span><span>{message.length}/1200</span></div>{mode === 'practice' && !result && <button type="button" className="text-link starter-link" disabled={busy} onClick={() => { setMessage(scene.starter); replyRef.current?.focus(); }}>Need a starting sentence? <ArrowRight size={16}/></button>}<label className="urgent-toggle"><input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} disabled={busy}/> This is happening now and someone may be in immediate danger.</label><button className="primary-link studio-submit" type="submit" disabled={busy || message.trim().length < 3}>{busy ? 'Finding the words…' : result ? 'Try my revised response' : mode === 'practice' ? 'Try my response' : 'Help me find the words'}<ArrowRight size={18}/></button></form> : <div className="practice-finish"><p className="eyebrow">{result?.coaching.stop_practice ? 'PRACTICE PAUSED' : 'PRACTICE COMPLETE'}</p><p>{result?.coaching.stop_practice ? 'Get appropriate help before continuing.' : 'You’ve practised the words. The next step belongs in real life.'}</p><button className="text-link" onClick={() => reset()}><RotateCcw size={17}/> Start a new practice</button></div>}
        {error && <p role="alert" className="studio-error">{error}</p>}
        {result && !result.coaching.stop_practice && <div className="takeaway"><Bookmark size={21}/><div><p className="eyebrow">ONE THING TO TAKE WITH YOU</p><p>{result.coaching.next_action}</p><button className="text-link" onClick={saveAction} disabled={saveNote.startsWith('Saved')}>{saveNote.startsWith('Saved') ? <Check size={17}/> : <Bookmark size={17}/>} Save this takeaway</button></div></div>}
        <p className="save-note" role="status">{saveNote}</p>
        {result && <details className="workflow-details"><summary>How this response was made</summary><p>{result.workflow.join(' → ')}</p><p>{result.model ? `Google ADK 2.9 · ${result.model}. AI can make mistakes. Source links provide context, not expert endorsement.` : 'Prewritten guidance. No AI assessment was performed.'}</p></details>}
      </div>
    </div>
    <div className="practice-notebook"><div><p className="eyebrow">YOUR POCKET REMINDERS</p><h3>Take it off <em>the internet.</em></h3><p>{saved.length ? `${saved.length} saved takeaway${saved.length === 1 ? '' : 's'}. A reminder, not a measure of your character.` : 'Your saved actions will appear here. Start with one small thing.'}</p>{saved.length > 0 && <><ul>{saved.slice(0, 5).map(item => <li key={item.id}><Check size={17}/>{item.action}</li>)}</ul><button className="text-link" onClick={clearSaved}>Clear saved takeaways</button></>}</div><div className="progress-account">{client ? userId ? <><p>Signed in. New takeaways and practice milestones sync to your account.</p><a className="text-link" href="/dashboard">Open my path <ArrowRight size={17}/></a><button className="text-link" onClick={async () => { await client.auth.signOut(); setSaved([]); try { localStorage.removeItem(STORAGE); } catch {} setAuthNote('Signed out.'); }}>Sign out</button></> : <form onSubmit={signIn}><label htmlFor="progress-email">Keep new takeaways across devices</label><p>Optional email sign-in. You can keep practising without it.</p><input id="progress-email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/><button className="text-link" type="submit">Email me a sign-in link <ArrowRight size={17}/></button></form> : <><Bookmark size={24}/><p>Saved on this browser. Account sync will be available when connected.</p></>}<p role="status">{authNote}</p></div></div>
    <p className="studio-footnote">An educational practice tool, not an emergency service. AI responses may be imperfect. You can stop any scenario. When AI is enabled, what you type is sent to Google to generate a response.</p>
  </section>;
}
