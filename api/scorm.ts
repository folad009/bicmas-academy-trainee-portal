import { getAccessToken } from "@/utils/auth";
import type { ScormManifestResponse } from "@/types";

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
): Promise<{ launchUrl: string }> => {
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

  return res.json();
};




/**
 * SCORM-compliant launch resolver
 * Uses manifest instead of guessing index.html
 
export const fetchScormLaunchUrl = async (
  scormPackageId: string
): Promise<{ launchUrl: string }> => {
  const manifestResponse = await fetchScormManifest(scormPackageId);

  // 1. Extract entry point from manifest
  const entryPoint =
    manifestResponse.manifest.resources[0].resource[0].$.href;
  // e.g. "res/index.html"

  // 2. Backend must provide where the package lives in blob storage
  const basePath = manifestResponse.basePath;
  // e.g. "scorm/2026-01-25T20-59-22-605Z-lesson-1"

  if (!entryPoint || !basePath) {
    throw new Error("Invalid SCORM manifest data");
  }

  // 3. Construct real launch URL
  const launchUrl = `https://blob.vercel-storage.com/${basePath}/${entryPoint}`;

  return { launchUrl };
};*/
