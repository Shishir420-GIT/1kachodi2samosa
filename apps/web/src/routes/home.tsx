import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { Hero } from '@/components/home/hero';
import { Manifesto } from '@/components/home/manifesto';
import { FieldGuide } from '@/components/home/field-guide';
import { RealityCheck } from '@/components/home/reality-check';
import { Solidarity } from '@/components/home/solidarity';
import { PracticeStudio } from '@/components/home/practice-studio';
import { SiteFooter } from '@/components/site-footer';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Dear Men — Be a man. Not that man.',
    description: 'A sarcastic guide with a serious purpose: stop making women responsible for men’s behavior. Read the field guide, check your instincts, and show up better.',
  });
}

export default function HomePage() {
  return <><a className="skip-link" href="#guide">Skip to the field guide</a><SiteHeader/><main><Hero/><Manifesto/><FieldGuide/><RealityCheck/><PracticeStudio/><Solidarity/></main><SiteFooter/></>;
}
