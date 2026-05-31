'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '../lib/authClient';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Submit Assignment', href: '/submit-assignment' },
  { label: 'My Results', href: '/my-results' },
  { label: 'Exam Tutor', href: '/exam-tutor' },
  { label: 'AI Professor', href: '/ai-professor' },
  { label: 'References', href: '/references' },
  { label: 'Past Papers', href: '/past-papers' },
  { label: 'Content Hub', href: '/content-hub' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [name, setName] = useState('Student');

  useEffect(() => {
    const stored = localStorage.getItem('userName');
    if (stored) setName(stored);
  }, []);

  const initial = name.charAt(0).toUpperCase() || 'S';

  return (
    <aside className="border-b border-edu-border bg-edu-logo lg:fixed lg:left-0 lg:top-[4.5rem] lg:z-30 lg:h-[calc(100vh-4.5rem)] lg:w-[300px] lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-edu-border bg-edu-surface p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-lg font-semibold text-slate-950">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-edu-accent">Student</p>
            <p className="truncate text-base font-semibold text-edu-text">{name}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-2.5 text-sm transition ${
                  active
                    ? 'bg-cyan-500/15 font-medium text-edu-accent'
                    : 'text-edu-muted hover:bg-cyan-500/10 hover:text-edu-text'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden pt-6 lg:block">
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full rounded-xl border border-edu-border bg-edu-surface px-4 py-3 text-sm text-edu-muted transition hover:border-cyan-500/40 hover:text-edu-text"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
