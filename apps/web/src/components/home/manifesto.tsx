import { Asterisk } from 'lucide-react';

export function Manifesto() {
  return <section className="manifesto" aria-labelledby="manifesto-title">
    <p className="eyebrow">01 / LET’S FLIP THE SCRIPT</p>
    <h2 id="manifesto-title">She doesn’t need another safety tip.<br/><span>He needs to stop being the reason.</span></h2>
    <div className="manifesto-bottom"><Asterisk size={38}/><p>This isn’t about every man being the problem. It’s about every man having a part in the solution. The jokes are sarcastic. <strong>The responsibility is not.</strong></p></div>
  </section>;
}
