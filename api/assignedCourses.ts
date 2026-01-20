import { getAccessToken } from "@/utils/auth";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app";

export async function fetchAssignedCourses() {
  const token = getAccessToken();

  const res = await fetch(
    `${BASE_URL}/api/v1/assignments/assigned-courses`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch assigned courses");
  }

  return res.json();
}
