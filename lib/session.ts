const SESSION_COOKIE_PREFIX = 'eduai_';
const COOKIE_NAMES = {
  id: `${SESSION_COOKIE_PREFIX}userId`,
  email: `${SESSION_COOKIE_PREFIX}userEmail`,
  name: `${SESSION_COOKIE_PREFIX}userName`
};

export function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...valueParts] = cookie.split('=');
    if (!name) return;
    cookies[name.trim()] = decodeURIComponent(valueParts.join('=').trim());
  });

  return cookies;
}

export function getSessionFromRequest(request: Request) {
  const cookies = parseCookies(request.headers.get('cookie'));
  const userId = request.headers.get('x-user-id') || cookies[COOKIE_NAMES.id];
  const userEmail = request.headers.get('x-user-email') || cookies[COOKIE_NAMES.email];
  const userName = request.headers.get('x-user-name') || cookies[COOKIE_NAMES.name];

  if (!userId) {
    return null;
  }

  return {
    user: {
      id: userId,
      email: userEmail || null,
      name: userName || null
    }
  };
}

export function getSessionFromCookies(cookieStore: any) {
  const userId = cookieStore.get(COOKIE_NAMES.id)?.value;
  if (!userId) {
    return null;
  }

  return {
    user: {
      id: userId,
      email: cookieStore.get(COOKIE_NAMES.email)?.value || null,
      name: cookieStore.get(COOKIE_NAMES.name)?.value || null
    }
  };
}

export function getSessionCookies(user: { id: string; email: string | null; name: string | null }) {
  return [
    `${COOKIE_NAMES.id}=${encodeURIComponent(user.id)}; Path=/; SameSite=Lax; Max-Age=604800`,
    `${COOKIE_NAMES.email}=${encodeURIComponent(user.email ?? '')}; Path=/; SameSite=Lax; Max-Age=604800`,
    `${COOKIE_NAMES.name}=${encodeURIComponent(user.name ?? '')}; Path=/; SameSite=Lax; Max-Age=604800`
  ];
}

export function clearSessionCookies() {
  return [
    `${COOKIE_NAMES.id}=; Path=/; SameSite=Lax; Max-Age=0`,
    `${COOKIE_NAMES.email}=; Path=/; SameSite=Lax; Max-Age=0`,
    `${COOKIE_NAMES.name}=; Path=/; SameSite=Lax; Max-Age=0`
  ];
}

export function applySessionCookies(response: Response, cookies: string[]) {
  cookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
  return response;
}

export type AppSession = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
};

/** Server-side session from cookies (App Router pages and route handlers). */
export async function getServerSession(request?: Request): Promise<AppSession | null> {
  if (request) {
    return getSessionFromRequest(request);
  }

  const { cookies } = await import('next/headers');
  return getSessionFromCookies(await cookies());
}
