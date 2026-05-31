'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../lib/authClient';
import { useTheme } from './Providers';
import Logo from './Logo';

const publicLinks = [
  { label: 'Sign in', href: '/login' },
  { label: 'Register', href: '/register' }
];

export default function AppNavBar() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-md transition-colors ${
      theme === 'dark'
        ? 'border-white/10 bg-[#080b10]/95'
        : 'border-gray-200 bg-white/95'
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href={isAuthPage ? '/' : '/dashboard'}
          className="flex items-center gap-2 transition hover:opacity-80"
        >
          <Logo />
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-full px-3 py-2 text-sm transition ${
              theme === 'dark'
                ? 'border border-white/10 text-white hover:border-cyan-500/40 hover:bg-slate-950/50'
                : 'border border-gray-300 text-gray-900 hover:border-cyan-500/40 hover:bg-gray-50'
            }`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {isAuthPage ? (
            publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-3 py-2 text-sm transition ${
                  pathname === link.href
                    ? theme === 'dark'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-cyan-500 text-white'
                    : theme === 'dark'
                      ? 'border border-white/10 text-white hover:border-cyan-500/40'
                      : 'border border-gray-300 text-gray-900 hover:border-cyan-500/40'
                }`}
              >
                {link.label}
              </Link>
            ))
          ) : (
            <Link
              href="/dashboard"
              className={`rounded-2xl px-3 py-2 text-sm transition ${
                theme === 'dark'
                  ? 'border border-white/10 bg-slate-950/80 text-white hover:border-cyan-500/40'
                  : 'border border-gray-300 bg-gray-50 text-gray-900 hover:border-cyan-500/40'
              }`}
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
