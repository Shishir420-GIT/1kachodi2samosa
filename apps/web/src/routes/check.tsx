import type { Route } from './+types/check';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { RealityCheck } from '@/components/home/reality-check';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'Reality check — Dear Men', description: 'Check how you would respond in three everyday situations, then take the next step into conversation practice.' });
}
export default function CheckPage() { return <><SiteHeader/><main className="standalone-page"><RealityCheck/></main><SiteFooter/></>; }
