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

  // Properly merge headers without unsafe casting
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if(!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers
  })

  let data;
  try {
    data = await res.json();
  } catch (parseError) {
    // If JSON parsing fails, try to get text for better error reporting
    const text = await res.text().catch(() => "<unable to read response body>");
    if (process.env.NODE_ENV !== "production") {
      console.log("[API RESPONSE]", {
        url,
        status: res.status,
        ok: res.ok,
        parseError,
        responseText: text
      });
    }
    if (!res.ok) {
      console.error("API Error:", {url, status: res.status, text});
      throw new Error(`API request failed: ${res.status} ${text}`);
    }
    // Success status but unparseable JSON is unexpected
    throw new Error(`Unexpected non-JSON success response from ${url} (${res.status}): ${text}`);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[API RESPONSE]", {
      url,
      status: res.status,
      ok: res.ok,
      data
    });
  }

  if (!res.ok) {
    console.error("API Error:", {url, status: res.status, data});
    throw new Error(data?.message || "API request failed");
  }

  if (data === null) {
    throw new Error(`Unexpected null data from successful API response: ${url} (${res.status})`);
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

  // Validate that attemptId is present before constructing normalized object
  const computedAttemptId = res.data.attemptId || res.data.attempt?.id;
  if (!computedAttemptId) {
    console.error("[SCORM SYNC] Missing attemptId in response", {data: res.data});
    throw new Error("Missing attemptId in sync response - cannot proceed");
  }

  const normalized = {
    // Backend authoritative identity
    attemptId: computedAttemptId,

    // Use top-level package id (not nested attempt one)
    scormPackageId: res.data.scormPackageId,

    completionPercentage: res.data.completionPercentage ?? 0,
    status: res.data.status as AttemptStatus,
  };

  return normalized;
};