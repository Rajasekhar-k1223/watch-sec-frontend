import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'maplibre-gl/dist/maplibre-gl.css'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

// ─────────────────────────────────────────────────────────────────────────────
// Global Fetch Interceptor — 401 / Session Expired Redirect
//
// Patches window.fetch ONCE at app boot so that EVERY fetch() call in every
// page/component automatically redirects to /login when the backend returns
// 401 Unauthorized. No need to update individual pages.
// ─────────────────────────────────────────────────────────────────────────────
const _originalFetch = window.fetch.bind(window);

window.fetch = async function interceptedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = sessionStorage.getItem('token');
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  // Auto-inject Authorization header for all /api calls if token exists in session
  if (token && url.includes('/api')) {
    init = init || {};
    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    init.headers = headers;
  }

  const response = await _originalFetch(input, init);

  if (response.status === 401) {
    // Only redirect for authenticated /api/ calls if the token was actually sent and rejected
    if (url.includes('/api') && !url.includes('/api/auth/login') && !url.includes('/api/auth/token')) {
      if (token) {
        // Clear session only on real session expiration
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?reason=session_expired';
        }
      }
    }
  }

  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
