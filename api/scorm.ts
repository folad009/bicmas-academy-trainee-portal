import { getAccessToken } from "@/utils/auth";
import { ScormLaunchResponse, ScormManifestResponse } from "@/types";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

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

  if (!res.ok) throw new Error("Failed to load SCORM manifest");
  return res.json();
};

export const fetchScormLaunchUrl = async (
  scormPackageId: string
): Promise<ScormLaunchResponse> => {
  if (!scormPackageId) {
    throw new Error("Missing scormPackageId");
  }

  const res = await fetch(
    `${BASE_URL}/scorm-packages/${scormPackageId}/launch?file=index`,
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }
  );

  if (!res.ok) throw new Error("Failed to load SCORM launch URL");
  return res.json();
};
