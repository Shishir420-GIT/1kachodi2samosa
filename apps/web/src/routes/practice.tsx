import type { Route } from './+types/practice';
import { seo } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PracticeStudio } from '@/components/home/practice-studio';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'Practice studio — Dear Men', description: 'Practise responding to a harmful joke, a crossed boundary or a bystander moment with an AI coach.' });
}
export default function PracticePage() { return <><SiteHeader/><main className="standalone-page"><PracticeStudio/></main><SiteFooter/></>; }
