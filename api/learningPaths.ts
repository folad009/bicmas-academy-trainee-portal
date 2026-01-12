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

  const res = await fetch(`${BASE_URL}/learning-paths`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch learning paths");
  }

  return res.json();
}
