import { getAccessToken } from "@/utils/auth";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app";

export async function fetchAssignedCourses() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No access token");
  }

  const res = await fetch(
    `${BASE_URL}/api/v1/assignments/assigned-courses`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Unauthorized");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch assigned courses");
  }

  return res.json();
}
