// Central Configuration for Monitorix Frontend
// Sovereign On-Premises & Enterprise Deployment: Defaults to Relative Paths & Local Origin
export const API_URL = import.meta.env.VITE_API_URL || "/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "");

