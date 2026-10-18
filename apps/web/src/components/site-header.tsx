import { useState } from 'react';
import { ArrowUpRight, Menu, X, Asterisk } from 'lucide-react';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <a className="brand" href="/#top" aria-label="Dear Men home"><Asterisk size={30} strokeWidth={2.5} /><span>dear men<span className="brand-dot">.</span></span></a>
    <nav className={open ? 'navigation is-open' : 'navigation'} aria-label="Main navigation">
      <a href="/#guide" onClick={() => setOpen(false)}>Field guide</a>
      <a href="/#practice" onClick={() => setOpen(false)}>Practice</a>
      <a href="/dashboard" onClick={() => setOpen(false)}>My path</a>
      <a href="/stories" onClick={() => setOpen(false)}>Story wall <ArrowUpRight size={15}/></a>
    </nav>
    <span className="header-note">A little less entitlement.<br/>A lot more humanity.</span>
    <button className="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
  </header>;
}
