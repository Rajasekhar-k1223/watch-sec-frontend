import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
  const response = await _originalFetch(input, init);

  if (response.status === 401) {
    // Only redirect for /api/ calls — not for CDN assets, sockets, etc.
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('/api')) {
      // Clear session
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Redirect to login with reason, but only if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=session_expired';
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
