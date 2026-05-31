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

export function Providers({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionContextType>({
    data: null,
    status: 'loading'
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    setTheme(savedTheme || 'dark');
    
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
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <SessionContext.Provider value={session}>
        <div className={theme === 'light' ? 'light' : 'dark'}>
          {children}
        </div>
      </SessionContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export function useTheme() {
  return useContext(ThemeContext);
}
