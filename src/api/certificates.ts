import { getApiV1BaseUrl } from "@/config/api";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";

const BASE_URL = getApiV1BaseUrl();

interface CertificatePayload {
  id: string;
  userId: string;
  courseId: string;
  templateId: string;
  issuedAt: string;
  pdfPath?: string;
  verificationHash: string;
  issuedBy?: string;
}

export interface ClaimCertificateResponse {
  certificate: CertificatePayload;
  issued: boolean;
}

export const claimMyCourseCertificate = async (
  courseId: string,
): Promise<ClaimCertificateResponse> => {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/certificates/my-courses/${courseId}/certificate`,
    { method: "POST" },
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = body?.error || "Failed to claim certificate";
    throw new Error(message);
  }

  return body as ClaimCertificateResponse;
};
