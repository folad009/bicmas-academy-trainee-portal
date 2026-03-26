import { getAccessToken } from "@/utils/auth";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";

// Use environment configuration to allow local/dev/staging to override the backend URL
const BASE_URL =
 "https://bicmas-academy-main-backend-production.up.railway.app/api/v1"

if (!BASE_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_API_BASE_URL environment variable. Please set it before running the app.",
  );
}

export async function fetchAssignedCourses() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No access token");
  }

  const res = await fetchWithAuthRetry(`${BASE_URL}/assignments/assigned-courses`);

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Unauthorized");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch assigned courses");
  }

  return res.json();
}
