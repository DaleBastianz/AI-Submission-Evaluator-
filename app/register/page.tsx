'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from '../../components/PasswordInput';
import { persistUserSession } from '../../lib/authClient';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result?.error || 'Unable to create account.');
        return;
      }

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const loginResult = await loginResponse.json();
      if (!loginResponse.ok) {
        setMessage('Account created, but login failed. Please sign in manually.');
        return;
      }

      persistUserSession(loginResult.user);
      router.push('/dashboard');
    } catch {
      setMessage('Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'mt-2 w-full rounded-3xl border border-edu-border bg-edu-surface px-4 py-4 text-edu-text outline-none focus:border-cyan-500/70';

  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-edu-page px-6 py-10 text-edu-text">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 rounded-[2rem] border border-edu-border bg-edu-surface p-10 shadow-glow lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-edu-accent">Student registration</p>
          <h1 className="text-4xl font-semibold text-edu-text">Create your EduAI student account.</h1>
          <p className="mt-4 text-edu-muted">Register quickly to upload lectures, prepare for exams, and use AI-powered study tools.</p>
        </div>

        <form onSubmit={onSubmit} className="w-full rounded-[2rem] border border-edu-border bg-edu-page p-8 shadow-xl">
          <div className="space-y-5">
            <label className="block text-sm text-edu-muted">
              Name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required />
            </label>
            <label className="block text-sm text-edu-muted">
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} required />
            </label>
            <PasswordInput
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
            {message && <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
          <p className="mt-6 text-sm text-edu-muted">
            Already registered?{' '}
            <Link href="/login" className="text-edu-accent hover:opacity-80">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
