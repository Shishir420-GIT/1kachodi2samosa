import { json } from '@/lib/api.server';
export function loader() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
  const configured = url.startsWith('https://') && !!key && !url.includes('YOUR_') && !key.includes('YOUR_');
  return json({ aiMode: process.env.AI_MODE === 'live' ? 'live' : 'demo', supabase: configured ? { url, key } : null });
}
