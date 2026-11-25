import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { Hero } from '@/components/home/hero';
import { Manifesto } from '@/components/home/manifesto';
import { SiteFooter } from '@/components/site-footer';
import { ArrowUpRight, BookOpen, Bot, ListChecks, MessageCircle } from 'lucide-react';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Dear Men — Be a man. Not that man.',
    description: 'A sarcastic guide with a serious purpose: stop making women responsible for men’s behavior. Read the field guide, check your instincts, and show up better.',
  });
}

export default function HomePage() {
  const paths = [
    { href: '/guide', number: '01', title: 'Read the field guide', note: 'Six concrete patterns to notice and interrupt.', icon: BookOpen },
    { href: '/check', number: '02', title: 'Check your instincts', note: 'Three quick situations. No virtue score.', icon: ListChecks },
    { href: '/practice', number: '03', title: 'Practise the words', note: 'Use an ADK coach and simulated practice partner.', icon: MessageCircle },
    { href: '/ai', number: '04', title: 'See how AI is used', note: 'Inspect the agents, privacy checks and live status.', icon: Bot },
  ];
  return <><a className="skip-link" href="#choose">Skip to ways to begin</a><SiteHeader/><main><Hero/><Manifesto/><section className="home-paths section-rail" id="choose" aria-labelledby="choose-title"><p className="eyebrow">CHOOSE ONE SMALL PLACE TO START</p><div className="section-heading"><div><h2 id="choose-title">A site with paths.<br/><em>Not one long lecture.</em></h2></div><p>Read. Check.<br/>Practise. Return.</p></div><div className="path-card-grid">{paths.map(path => { const Icon = path.icon; return <a className="path-card" href={path.href} key={path.href}><span>{path.number}</span><Icon size={27}/><h3>{path.title}</h3><p>{path.note}</p><ArrowUpRight size={20}/></a>; })}</div></section></main><SiteFooter/></>;
}
