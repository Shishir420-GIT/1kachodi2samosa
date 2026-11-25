/**
 * Calls the Python/ADK backend. On Cloud Run that process shared a container
 * with this one, reachable at a fixed loopback port. On Vercel it is a
 * separate serverless deployment with its own public URL, so every call
 * needs an explicit base URL and a shared secret the browser never sees.
 */
const BACKEND_URL = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const backendFetch = (path: string, init: RequestInit = {}): Promise<Response> => {
	const headers = new Headers(init.headers);
	const secret = process.env.BACKEND_SHARED_SECRET;

	if (secret) {
		headers.set('x-backend-secret', secret);
	}

	return fetch(`${BACKEND_URL}${path}`, { ...init, headers });
};
