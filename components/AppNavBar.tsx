'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../lib/authClient';
import Logo from './Logo';
import { useTheme } from './Providers';

const publicLinks = [
  { label: 'Sign in', href: '/login' },
  { label: 'Register', href: '/register' }
];

export default function AppNavBar() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-edu-border bg-edu-logo backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href={isAuthPage ? '/' : '/dashboard'} className="flex shrink-0 items-center transition hover:opacity-90">
          <Logo />
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-edu-border px-3 py-2 text-sm text-edu-text transition hover:border-cyan-500/50"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          {isAuthPage ? (
            publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  pathname === link.href
                    ? 'bg-cyan-500 text-slate-950'
                    : 'border border-edu-border text-edu-text hover:border-cyan-500/50'
                }`}
              >
                {link.label}
              </Link>
            ))
          ) : (
            <Link
              href="/dashboard"
              className="rounded-2xl border border-edu-border px-3 py-2 text-sm text-edu-text transition hover:border-cyan-500/50"
            >
              Home
            </Link>
          )}

          {!isAuthPage && (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-2xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
