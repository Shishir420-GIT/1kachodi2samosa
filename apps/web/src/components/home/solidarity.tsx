import { useState } from 'react';
import { ArrowUpRight, Copy, Check, Asterisk } from 'lucide-react';

export function Solidarity() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href.split('#')[0]); setCopied(true); setError(false); }
    catch { setError(true); }
  }
  return <section className="solidarity section-rail" id="solidarity" aria-labelledby="solidarity-title">
    <span className="vertical-label">SOLIDARITY IS A VERB</span>
    <p className="eyebrow">05 / TAKE IT OFF THE INTERNET</p>
    <div className="solidarity-heading"><h2 id="solidarity-title">Don’t just<br/><em>nod along.</em></h2><Asterisk size={115} strokeWidth={1.3}/></div>
    <div className="solidarity-content"><p>Being an ally isn’t a bio update. It’s the conversation with your friend, the boundary you respect, the work you share, and the behavior you change.</p><div className="resource-links"><a href="https://www.unwomen.org/en/what-we-do/ending-violence-against-women" target="_blank" rel="noopener noreferrer"><span>Understand the bigger picture<small>UN Women · Ending violence against women</small></span><ArrowUpRight/></a><a href="https://righttobe.org/guides/bystander-intervention-training/" target="_blank" rel="noopener noreferrer"><span>Learn how to safely step in<small>Right To Be · Bystander intervention</small></span><ArrowUpRight/></a><a href="https://www.respectphoneline.org.uk/" target="_blank" rel="noopener noreferrer"><span>Get help changing harmful behavior<small>Respect Phoneline · UK-based support</small></span><ArrowUpRight/></a></div></div>
    <div className="share-line"><p>Know someone who should read this?<br/><em>Subtlety is overrated.</em></p><button className="primary-link" onClick={share}>{copied ? 'Link copied. Pass it on.' : 'Pass the message on'}{copied ? <Check size={19}/> : <Copy size={19}/>}</button><span role="status" className="share-status">{error ? 'Couldn’t copy the link. You can share the address from your browser.' : ''}</span></div>
    <aside className="support-note"><strong>A serious note.</strong> If you’re experiencing harm, it is not your fault and you don’t owe anyone a lesson. In immediate danger, contact local emergency services if it is safe to do so. Find support in your country through <a href="https://www.hotpeachpages.net/" target="_blank" rel="noopener noreferrer">the international abuse-support directory <ArrowUpRight size={13}/></a>. This page is educational, not professional or crisis support.</aside>
  </section>;
}
