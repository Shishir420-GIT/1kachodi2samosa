import { apiError, json, withApi } from '@/lib/api.server';
import { clientIdentifier, createRateLimiter } from '@/lib/rate-limit.server';

const storyBudget = createRateLimiter({ maxRequests: 5, windowSeconds: 60 * 60 });

export const action = withApi(async ({ request }) => {
  if (request.method !== 'POST') return apiError(405, 'Use POST');
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return apiError(403, 'Origin not allowed');
  if (!request.headers.get('content-type')?.includes('application/json')) return apiError(415, 'Use JSON');
  if (!await storyBudget(clientIdentifier(request))) return apiError(429, 'Please wait before submitting another story.');
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > 5000) return apiError(413, 'Story too long');
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > 5000) return apiError(413, 'Story too long');
    const response = await fetch('http://127.0.0.1:8000/stories', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: AbortSignal.timeout(40000),
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : response.status === 422 ? 'Check the story length, consent, and identifying details.' : 'Story submission is unavailable.';
      return apiError(response.status === 422 ? 400 : 503, detail);
    }
    return json(data);
  } catch (error) {
    return apiError(error instanceof SyntaxError ? 400 : 503, error instanceof SyntaxError ? 'Invalid JSON' : 'Story submission is unavailable.');
  }
});

export const loader = () => apiError(405, 'Use POST');
