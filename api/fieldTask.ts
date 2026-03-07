import { getAccessToken } from "@/utils/auth";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app";

export async function fieldTask(
  moduleTitle: string,
  description: string,
  files: File | File[]
) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Authentication token is missing");
  }

  const fileArray = Array.isArray(files) ? files : [files];

  if (fileArray.length === 0) {
    throw new Error("No files provided for upload");
  }

  const formData = new FormData();
  formData.append("moduleTitle", moduleTitle);
  formData.append("description", description);

  // append files individually
  fileArray.forEach((file) => {
    formData.append("media", file);
  });

  try {
    const response = await fetch(`${BASE_URL}/api/v1/field-tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Field task upload failed:", errorText);
      throw new Error(errorText || "Failed to submit field task");
    }

    const result = await response.json();
    return result?.data ?? result;
  } catch (error) {
    console.error("Field task request crashed:", error);
    throw error;
  }
}