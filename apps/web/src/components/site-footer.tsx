import { Asterisk, ArrowUp } from 'lucide-react';

export function SiteFooter() {
  return <footer className="site-footer"><a className="brand" href="/#top"><Asterisk size={27}/><span>dear men.</span></a><p>Less “not all men.”<br/><em>More “not on my watch.”</em></p><div className="footer-right"><nav aria-label="Footer navigation"><a href="/ai">How AI works</a><a href="/resources">Resources</a><a href="/logout">Sign out</a></nav><a href="/#top">Back home <ArrowUp size={16}/></a><span>© {new Date().getUTCFullYear()} Dear Men · Respect is the baseline.</span></div></footer>;
}
