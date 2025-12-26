// Central Configuration for WatchSec Frontend

// Default to Python Backend (Port 8000) unless VITE_API_URL Env Var is set
export const API_URL = import.meta.env.VITE_API_URL || "https://dark-explore-metric-ours.trycloudflare.com";

// Separate Socket URL if needed (usually same host)
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;
