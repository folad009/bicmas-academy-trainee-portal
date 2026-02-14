import { getAccessToken } from "@/utils/auth";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

type AttemptStatus = "IN_PROGRESS" | "COMPLETED";

interface SyncAttemptPayload {
  completionPercentage: number;
  status: AttemptStatus;
}

/**
 * Core authenticated request helper
 */
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("API Error:", {
      url,
      status: res.status,
      statusText: res.statusText,
      data
    });
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

/**
 * Update course attempt manually
 */
export const updateCourseAttempt = async (
  courseId: string,
  completionPercentage: number = 0
) => {
  const status: AttemptStatus =
    completionPercentage >= 100 ? "COMPLETED" : "IN_PROGRESS";

  const payload: SyncAttemptPayload = {
    completionPercentage,
    status
  };

  return authFetch(`${BASE_URL}/attempts/${courseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
};

/**
 * Sync SCORM progress from SCORM Cloud
 */
export const syncScormProgress = async (attemptId: string) => {
  return authFetch(
    `${BASE_URL}/attempts/${attemptId}/sync-progress`,
    {
      method: "PATCH"
    }
  );
};

/**
 * Smart sync:
 * 1. Pull SCORM progress
 * 2. Update local attempt if backend returns percentage
 */
export const syncCourseAttempt = async (attemptId: string) => {
  const scormRes = await syncScormProgress(attemptId);
  return scormRes?.data;
};

