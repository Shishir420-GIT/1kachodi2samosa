import { backendFetch } from '@/lib/backend.server';

export async function loader() {
  try {
    const r = await backendFetch('/health', { signal: AbortSignal.timeout(5000) });
    return Response.json(await r.json(), { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ ok: false }, { status: 503 }); }
}
