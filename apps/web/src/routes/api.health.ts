export async function loader() {
  try {
    const r = await fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(2000) });
    return Response.json(await r.json(), { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ ok: false }, { status: 503 }); }
}
