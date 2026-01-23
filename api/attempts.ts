import { getAccessToken } from "@/utils/auth";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";


export const syncCourseAttempt = async (
  courseId: string,
  completionPercentage: number = 0
) => {
  const status =
    completionPercentage === 100 ? "COMPLETED" : "IN_PROGRESS";

  const res = await fetch(
    `${BASE_URL}/attempts/${courseId}`,
    {
      method: "PATCH", // or PATCH depending on backend
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify({
        completionPercentage,
        status
      })
    }
  );

  if (!res.ok) {
    throw new Error("Failed to sync attempt");
  }

  return res.json();
};


