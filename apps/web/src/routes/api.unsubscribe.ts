import { apiError, json, withApi } from '@/lib/api.server';
import { backendFetch } from '@/lib/backend.server';

export const action = withApi(async ({ request }) => {
  if (request.method !== 'POST') return apiError(405, 'Use POST');
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return apiError(403, 'Origin not allowed');
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > 1500) return apiError(413, 'Invalid unsubscribe link');
    const response = await backendFetch('/reminders/unsubscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: AbortSignal.timeout(15000) });
    if (!response.ok) return apiError(response.status === 400 ? 400 : 503, response.status === 400 ? 'This unsubscribe link is invalid or expired.' : 'Unsubscribe is temporarily unavailable.');
    return json({ ok: true });
  } catch { return apiError(503, 'Unsubscribe is temporarily unavailable.'); }
});

export const loader = () => apiError(405, 'Use POST');
