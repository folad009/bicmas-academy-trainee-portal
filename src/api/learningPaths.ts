import { getAccessToken } from "@/utils/auth";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

export interface BackendLearningPath {
  id: string;
  title: string;
  description: string;
  curriculumSequence: string[];
  status: "DRAFT" | "PUBLISHED";
}

export async function fetchLearningPaths(): Promise<BackendLearningPath[]> {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/learning-paths`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Request to fetch learning paths timed out");
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error("Failed to fetch learning paths");
  }

  return res.json();
}
