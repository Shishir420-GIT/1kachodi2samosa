import type { Route } from './+types/guide';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FieldGuide } from '@/components/home/field-guide';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'The field guide — Dear Men', description: 'Six concrete patterns men can notice, interrupt and change in everyday life, relationships and bystander moments.' });
}
export default function GuidePage() { return <><SiteHeader/><main className="standalone-page"><FieldGuide/></main><SiteFooter/></>; }
