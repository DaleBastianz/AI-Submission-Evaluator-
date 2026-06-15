/** Parse JSON from an API response without throwing on empty bodies. */
export async function parseApiJson<T = Record<string, unknown>>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? 'Server returned an empty response.'
        : `Request failed (${response.status}). The server or database may be unavailable — try again in a moment.`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Server returned an invalid response (${response.status}).`);
  }
}

/**
 * Authenticated fetch for same-origin API routes.
 * Sends session cookies and localStorage session headers (fallback).
 */
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');

    if (userId) headers.set('x-user-id', userId);
    if (userEmail) headers.set('x-user-email', userEmail);
    if (userName) headers.set('x-user-name', userName);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include'
  });
}

export function getStoredSessionUser() {
  if (typeof window === 'undefined') return null;

  const id = localStorage.getItem('userId');
  if (!id) return null;

  return {
    id,
    email: localStorage.getItem('userEmail') || null,
    name: localStorage.getItem('userName') || null
  };
}
