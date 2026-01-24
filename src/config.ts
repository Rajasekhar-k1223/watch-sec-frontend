// Central Configuration for Monitorix Frontend

// Default to Python Backend (Port 8000) unless VITE_API_URL Env Var is set
// Default to Relative Paths (Enforces HTTPS and Single Domain via Nginx)
export const API_URL = "/api";
export const SOCKET_URL = "/";
