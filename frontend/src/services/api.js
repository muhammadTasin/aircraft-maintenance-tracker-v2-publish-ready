const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken() {
  return localStorage.getItem('aircraft_tracker_token');
}

export function saveAuth(authPayload) {
  localStorage.setItem('aircraft_tracker_token', authPayload.token);
  localStorage.setItem('aircraft_tracker_user', JSON.stringify(authPayload.user));
}

export function clearAuth() {
  localStorage.removeItem('aircraft_tracker_token');
  localStorage.removeItem('aircraft_tracker_user');
}

export function getStoredUser() {
  const storedUser = localStorage.getItem('aircraft_tracker_user');
  return storedUser ? JSON.parse(storedUser) : null;
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}
