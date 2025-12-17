import { getAccessToken } from '@/utils/auth';

const BASE_URL =
  'https://bicmas-academy-main-backend-production.up.railway.app/api/v1';

export async function registerDevice() {
  const token = getAccessToken();

  if (!token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${BASE_URL}/auth/device/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      deviceType: 'DESKTOP',
      deviceName: navigator.platform || 'Unknown Device',
      userAgent: navigator.userAgent,
    }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to register device');
  }

  return data;
}
