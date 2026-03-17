const BASE_URL =
  'https://bicmas-academy-main-backend-production.up.railway.app/api/v1';

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    throw new Error('Empty response from server');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed');
  }

  return data;
}

export async function loginWithEmail(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse(response);
}

export async function loginWithPhone(phoneNumber: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/phone-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, password }),
  });

  return parseResponse(response);
}