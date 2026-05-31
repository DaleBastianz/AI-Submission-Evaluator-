'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type SessionContextType = {
  data: { user: SessionUser } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
};

type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const SessionContext = createContext<SessionContextType>({
  data: null,
  status: 'loading'
});

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {}
});

function applyThemeClass(theme: 'light' | 'dark') {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}

export function Providers({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionContextType>({
    data: null,
    status: 'loading'
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') || 'dark') as 'light' | 'dark';
    setTheme(savedTheme);
    applyThemeClass(savedTheme);

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setSession({ data: null, status: 'unauthenticated' });
    } else {
      setSession({
        data: {
          user: {
            id: userId,
            email: localStorage.getItem('userEmail'),
            name: localStorage.getItem('userName')
          }
        },
        status: 'authenticated'
      });
    }

    setReady(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyThemeClass(newTheme);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-edu-page text-edu-text">
        <p className="text-sm text-edu-muted">Loading EduAI…</p>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export function useTheme() {
  return useContext(ThemeContext);
}
