export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export function persistUserSession(user: SessionUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userId', user.id);
  localStorage.setItem('userEmail', user.email ?? '');
  localStorage.setItem('userName', user.name ?? '');
}

export function clearUserSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Still clear local session if the request fails.
  }
  clearUserSession();
  window.location.href = '/login';
}
