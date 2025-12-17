const BASE_URL =
  'https://bicmas-academy-main-backend-production.up.railway.app/api/v1';

export async function login(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  // 🚨 IMPORTANT: read text first
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
    throw new Error(data.message || 'Login failed, invalid credentials');
  }

  return data;
}
