/**
 * Dynamic API Base URL resolver.
 * Handles:
 * - VITE_API_BASE_URL environment variable if provided
 * - Localhost desktop development
 * - Mobile / LAN device access (resolves to the host computer's IP at port 3000)
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // If explicitly set to a custom remote URL, use it unless it points directly to the
  // Render backend, which should always go through the same-origin proxy to ensure first-party cookies.
  if (
    envUrl &&
    typeof envUrl === "string" &&
    envUrl.trim() !== "" &&
    !envUrl.includes("portalacademia.onrender.com")
  ) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname) {
    const { protocol, hostname } = window.location;
    // When accessed from another device on the local network (e.g. 192.168.x.x)
    const isLocalIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.endsWith(".local");
    if (isLocalIp && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }
  }

  // Same-origin relative path:
  // - On Vercel: vercel.json rewrites /api/* to the Render backend
  // - In Vite dev: vite.config.ts proxies /api to http://localhost:3000
  return "";
}

export const API_BASE = getApiBaseUrl();
