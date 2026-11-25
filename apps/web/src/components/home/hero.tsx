import { ArrowDown, ArrowUpRight, Asterisk } from 'lucide-react';

export function Hero() {
  return <section className="hero" id="top" aria-labelledby="hero-title">
    <span className="vertical-label">AN OPEN LETTER / A MUCH-NEEDED REMINDER</span>
    <div className="hero-copy">
      <p className="eyebrow"><Asterisk className="small-star" size={18} aria-hidden="true"/> FOR MEN. NOT AT WOMEN’S EXPENSE.</p>
      <h1 id="hero-title">Be a man.<br/><span className="serif-line">Not <span className="underlined">that</span> man.</span></h1>
      <p className="hero-description">Women have been told what to wear, where to go, and how to stay safe. <strong>Plot twist: maybe men should be told what not to do.</strong></p>
      <a className="primary-link" href="/guide">Let’s start with the bare minimum <ArrowUpRight size={20}/></a>
      <p className="hero-footnote">Not a battle of the sexes. A conversation about behavior.</p>
    </div>
    <div className="hero-art" aria-hidden="true">
      <div className="art-backplate"/>
      <img className="stop-image" src="https://images.hostinger.com/ae7db394-ec99-4e68-b672-d52e1fbc5372.png" alt="" fetchPriority="high"/>
      <div className="stop-lettering">STOP<span>MAKING IT<br/>HER PROBLEM.</span></div>
      <span className="art-sticker">Basic respect.<br/><em>Radical concept.</em></span>
      <span className="art-caption">EXHIBIT A: THE ABILITY TO STOP.</span>
    </div>
    <div className="hero-bottom"><span>IN SOLIDARITY WITH WOMEN. EVERYWHERE.</span><a href="#choose">Choose where to begin <ArrowDown size={17}/></a></div>
  </section>;
}
