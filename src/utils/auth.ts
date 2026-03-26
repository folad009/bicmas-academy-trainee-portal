import { getJwtIssuedAtMs } from "@/utils/jwt";

const TOKEN_KEY = "access_token";
const USER_KEY = "auth_user";
const REFRESH_TOKEN_KEY = "refresh_token";
/** Wall-clock start of this login session (ms); used with JWT exp for max 24h session. */
const SESSION_STARTED_AT_KEY = "auth_session_started_at";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "Trainee";
  avatar: string;
};

type StoredAuth = {
  accessToken: string;
  refreshToken?: string | null;
  user: AuthUser;
};

const getStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readItem = (key: string) => getStorage()?.getItem(key) ?? null;

const writeItem = (key: string, value: string) => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const removeItem = (key: string) => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    candidate.role === "Trainee" &&
    typeof candidate.avatar === "string"
  );
};

export const getAccessToken = () => readItem(TOKEN_KEY);

export const getRefreshToken = () => readItem(REFRESH_TOKEN_KEY);

export const setAccessToken = (token: string) => writeItem(TOKEN_KEY, token);

export const setRefreshToken = (token: string | null) => {
  if (!token) {
    return removeItem(REFRESH_TOKEN_KEY);
  }

  return writeItem(REFRESH_TOKEN_KEY, token);
};

export const getStoredUser = (): AuthUser | null => {
  const raw = readItem(USER_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isAuthUser(parsed)) {
      removeItem(USER_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse stored user data:", error);
    removeItem(USER_KEY);
    return null;
  }
};

export const setStoredUser = (user: AuthUser) =>
  writeItem(USER_KEY, JSON.stringify(user));

const setSessionStartedAtNow = () =>
  writeItem(SESSION_STARTED_AT_KEY, String(Date.now()));

/**
 * Ms since epoch when the user signed in (new session). Used for the 24h cap.
 * Pass `accessToken` when the session key is missing (e.g. migration) to use JWT `iat`.
 */
export const getSessionStartedAtMs = (accessToken?: string | null): number => {
  const raw = readItem(SESSION_STARTED_AT_KEY);
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  if (accessToken) {
    const iat = getJwtIssuedAtMs(accessToken);
    if (iat != null) return iat;
  }
  return Date.now();
};

export const clearAuth = () => {
  removeItem(TOKEN_KEY);
  removeItem(REFRESH_TOKEN_KEY);
  removeItem(USER_KEY);
  removeItem(SESSION_STARTED_AT_KEY);
};

export const saveAuth = ({
  accessToken,
  refreshToken,
  user,
}: StoredAuth) => {
  setSessionStartedAtNow();
  const accessSaved = setAccessToken(accessToken);
  const refreshSaved = setRefreshToken(refreshToken ?? null);
  const userSaved = setStoredUser(user);

  return accessSaved && refreshSaved && userSaved;
};
