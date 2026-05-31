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
