import type { Route } from './+types/resources';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Solidarity } from '@/components/home/solidarity';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'Resources — Dear Men', description: 'Practical bystander, violence-prevention and behavior-change resources for taking the work beyond the website.' });
}
export default function ResourcesPage() { return <><SiteHeader/><main className="standalone-page"><Solidarity/></main><SiteFooter/></>; }
