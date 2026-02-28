import { getAccessToken } from "@/utils/auth";

const BASE_URL =
  typeof window !== "undefined" && typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://bicmas-academy-main-backend-production.up.railway.app"
    : process?.env?.NEXT_PUBLIC_API_BASE_URL ||
      "https://bicmas-academy-main-backend-production.up.railway.app";

export async function fieldTask(
  moduleTitle: string,
  description: string,
  file: File,
) {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");

  const formData = new FormData();
  formData.append("module title", moduleTitle);
  formData.append("description", description);
  formData.append("media", file);

  const res = await fetch(`${BASE_URL}/api/v1/field-tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // DO NOT set Content-Type manually
      // Browser will set multipart boundary automatically
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Field task upload error:", text);
    throw new Error(text || "Failed to submit field task");
  }

  const data = await res.json();
  return data.data ?? data;
}
