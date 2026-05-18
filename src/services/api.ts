/**
 * Monitorix Central API Client
 * ─────────────────────────────
 * Wraps the native fetch() API with:
 *  - Automatic Authorization header injection
 *  - Global 401 interception → clears session & redirects to /login
 *  - Consistent error typing
 */

const SESSION_KEY_TOKEN = 'token';
const SESSION_KEY_USER  = 'user';

// ── 401 Handler ─────────────────────────────────────────────────────────────
// Called by apiFetch whenever the backend returns 401 or 403.
// Clears session and navigates to /login without a full page reload.
function handleUnauthorized() {
    sessionStorage.removeItem(SESSION_KEY_TOKEN);
    sessionStorage.removeItem(SESSION_KEY_USER);

    // Avoid redirect loop if already on /login
    if (!window.location.pathname.startsWith('/login')) {
        // Using window.location rather than React Router's navigate so this
        // works outside of React component tree (e.g., background polling).
        window.location.href = '/login?reason=session_expired';
    }
}

// ── Core Fetch Wrapper ───────────────────────────────────────────────────────
export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = sessionStorage.getItem(SESSION_KEY_TOKEN);

    const headers = new Headers(options.headers ?? {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        // Try to read error detail before redirecting
        try {
            const data = await response.clone().json();
            // Only redirect on real auth errors, not plan/permission 403s
            const detail: string = data?.detail ?? '';
            const isAuthError =
                response.status === 401 ||
                detail.toLowerCase().includes('not authenticated') ||
                detail.toLowerCase().includes('invalid token') ||
                detail.toLowerCase().includes('token expired') ||
                detail.toLowerCase().includes('could not validate');

            if (isAuthError) {
                handleUnauthorized();
            }
        } catch {
            // Could not parse body — treat 401 as auth error regardless
            if (response.status === 401) {
                handleUnauthorized();
            }
        }
    }

    return response;
}

// ── Convenience Helpers ──────────────────────────────────────────────────────
export async function apiGet<T = unknown>(url: string): Promise<T> {
    const res = await apiFetch(url, { method: 'GET' });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json() as Promise<T>;
}

export async function apiPost<T = unknown>(url: string, body?: unknown): Promise<T> {
    const res = await apiFetch(url, {
        method: 'POST',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json() as Promise<T>;
}

export async function apiPut<T = unknown>(url: string, body?: unknown): Promise<T> {
    const res = await apiFetch(url, {
        method: 'PUT',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json() as Promise<T>;
}

export async function apiDelete<T = unknown>(url: string): Promise<T> {
    const res = await apiFetch(url, { method: 'DELETE' });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json() as Promise<T>;
}

// ── Error Type ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}
