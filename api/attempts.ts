import { getAccessToken } from "@/utils/auth";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";


export const syncCourseAttempt = async (
  courseId: string,
  completionPercentage: number = 0
) => {
  const status =
    completionPercentage === 100 ? "COMPLETED" : "IN_PROGRESS";

  const token = getAccessToken()

  const res = await fetch(
    `${BASE_URL}/attempts/${courseId}`,
    {
      method: "PATCH", // or PATCH depending on backend
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        completionPercentage,
        status
      })
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Sync error:", {
      status: res.status,
      statusText: res.statusText,
      data
    })
    throw new Error("Failed to sync attempt");
  }

  return data;
};


