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

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>)
  }

  if(!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers
  })

  const data = await res.json().catch(() => null);

  console.log("[API RESPONSE]", {
    url,
    status: res.status,
    ok: res.ok,
    data
  });
  
  if (!res.ok) {
    console.error("API Error:", {url, status: res.status, data});
    throw new Error(data?.message || "API request failed");
  }

  return data;
};

/**
 * Update course attempt manually
 */
export const updateAttemptProgress = async (
  attemptId: string,
  completionPercentage: number = 0
) => {
  const status: AttemptStatus =
    completionPercentage >= 100 ? "COMPLETED" : "IN_PROGRESS";

  const payload: SyncAttemptPayload = {
    completionPercentage,
    status
  };

  return authFetch(`${BASE_URL}/attempts/${attemptId}`, {
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
  const res = await syncScormProgress(attemptId);

  if (!res?.data) {
    console.error("[SCORM SYNC] No data returned", res);
    throw new Error("No attempt data returned from sync");
  }

  const normalized = {
    // Backend authoritative identity
    attemptId: res.data.attemptId || res.data.attempt?.id,

    // Use top-level package id (not nested attempt one)
    scormPackageId: res.data.scormPackageId,

    completionPercentage: res.data.completionPercentage ?? 0,
    status: res.data.status as AttemptStatus,
  };
  
  return normalized;
};