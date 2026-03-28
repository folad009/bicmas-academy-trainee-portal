/**
 * Single source for API base URL and auth refresh contract.
 * Override via Vite env at build time (see .env.example).
 */

const DEFAULT_API_V1 =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

export function getApiV1BaseUrl(): string {
  const v = import.meta.env.VITE_API_BASE_URL?.trim();
  if (v) return v.replace(/\/$/, "");
  return DEFAULT_API_V1;
}

/**
 * Full URL for refresh. Set VITE_AUTH_REFRESH_PATH to a path under VITE_API_BASE_URL
 * (e.g. /auth/refresh, /auth/refresh-token) or a full https URL if refresh lives elsewhere.
 */
export function getAuthRefreshUrl(): string {
  const path = import.meta.env.VITE_AUTH_REFRESH_PATH?.trim() || "/auth/refresh";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = getApiV1BaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * JSON body field name for the refresh token (default: refreshToken).
 * Set VITE_AUTH_REFRESH_TOKEN_FIELD to e.g. refresh_token if your API expects that.
 */
export function buildRefreshTokenRequestBody(refreshToken: string): string {
  const field =
    import.meta.env.VITE_AUTH_REFRESH_TOKEN_FIELD?.trim() || "refreshToken";
  return JSON.stringify({ [field]: refreshToken });
}
