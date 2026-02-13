import { getAccessToken } from "@/utils/auth";
import type { ScormManifestResponse } from "@/types";

interface ScormLaunchResponse {
  success: boolean;
  launchUrl: string;
  scormAttemptId: string;
  message?: string;
}


const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

/**
 * Fetch raw SCORM manifest from backend
 */
export const fetchScormManifest = async (
  scormPackageId: string
): Promise<ScormManifestResponse> => {
  if (!scormPackageId) {
    throw new Error("Missing scormPackageId");
  }

  const res = await fetch(
    `${BASE_URL}/scorm-packages/${scormPackageId}/manifest`,
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }
  );

  if (!res.ok) {
    throw new Error("Failed to load SCORM manifest");
  }

  return res.json();
};


export const fetchScormLaunchUrl = async (
  scormPackageId: string
): Promise<ScormLaunchResponse> => {
  const res = await fetch(
    `${BASE_URL}/scorm-packages/${scormPackageId}/launch`,
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to get SCORM launch URL");
  }

  const data: ScormLaunchResponse = await res.json();

  if (!data.launchUrl || !data.scormAttemptId) {
    throw new Error("Invalid launch response from server");
  }

  return data;
};

