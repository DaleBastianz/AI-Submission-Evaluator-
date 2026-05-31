'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setStatus('unauthenticated');
      router.replace('/login');
      return;
    }
    setStatus('authenticated');
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-edu-page">
        <div className="rounded-3xl border border-edu-border bg-edu-surface p-8 text-center shadow-glow">
          <p className="text-edu-text">Loading your EduAI workspace…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-edu-page text-edu-text">
      <Sidebar />
      <div className="lg:ml-[300px]">
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
