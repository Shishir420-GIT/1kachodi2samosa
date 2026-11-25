import { apiError, json, withApi } from '@/lib/api.server';
import { backendFetch } from '@/lib/backend.server';
import { createRateLimiter } from '@/lib/rate-limit.server';
// Global per-process budget cannot be bypassed by spoofing forwarding headers.
// Cloud Run deployment caps instances; a distributed quota is needed at larger scale.
const budget = createRateLimiter({ maxRequests: 30, windowSeconds: 60 });
export const action = withApi(async ({ request }) => {
  if (request.method !== 'POST') return apiError(405, 'Use POST');
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return apiError(403, 'Origin not allowed');
  if (!request.headers.get('content-type')?.includes('application/json')) return apiError(415, 'Use JSON');
  if (!await budget('all')) return apiError(429, 'The studio is busy. Please try again in a minute.');
  if (Number(request.headers.get('content-length')) > 12000) return apiError(413, 'Response too long');
  const reader = request.body?.getReader();
  if (!reader) return apiError(400, 'Missing response');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 12000) return apiError(413, 'Response too long');
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const response = await backendFetch('/respond', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(40000),
    });
    if (!response.ok) return apiError(response.status === 422 ? 400 : 503, 'Check your response and try again.');
    return json(await response.json());
  } catch (error) {
    return apiError(error instanceof SyntaxError ? 400 : 503, error instanceof SyntaxError ? 'Invalid JSON' : 'The practice service is unavailable. Please try again.');
  }
});
export const loader = () => apiError(405, 'Use POST');
