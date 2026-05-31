'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedLayout from '../../components/ProtectedLayout';
import { apiFetch } from '../../lib/apiClient';

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
};

type DashboardData = {
  user: { id: string; email: string | null; name: string | null };
  stats: {
    submissionCount: number;
    avgScore: number;
    examCount: number;
    lectureCount: number;
  };
  activityFeed: ActivityItem[];
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch('/api/dashboard');
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || 'Could not load dashboard.');
        }
        setData(result);
      } catch (err: any) {
        setError(err?.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {loading && (
          <div className="rounded-[2rem] border border-edu-border bg-edu-surface p-8 text-center text-edu-muted shadow-glow">
            Loading your dashboard…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-red-200">{error}</div>
        )}

        {data && !loading && (
          <section className="rounded-[2rem] border border-edu-border bg-edu-surface p-8 shadow-glow">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
              <p className="text-sm uppercase tracking-[0.3em] text-edu-accent">Welcome back</p>
              <h1 className="mt-3 text-4xl font-semibold text-edu-text">
                  {data.user.name ? `Hi, ${data.user.name}` : 'EduAI student dashboard'}
                </h1>
                <p className="mt-3 max-w-2xl text-edu-muted">
                  Your workspace for assignments, exam prep, lectures, references, and past papers.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: 'Assignments submitted', value: data.stats.submissionCount },
                { title: 'Average score', value: `${data.stats.avgScore || 0}%` },
                { title: 'Exam sessions', value: data.stats.examCount },
                { title: 'Lectures uploaded', value: data.stats.lectureCount }
              ].map((card) => (
              <div key={card.title} className="rounded-[2rem] border border-edu-border bg-edu-page p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-edu-muted">{card.title}</p>
                <p className="mt-4 text-3xl font-semibold text-edu-text">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-edu-border bg-edu-page p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-edu-accent">Quick access</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Submit Assignment', href: '/submit-assignment' },
                    { label: 'My Results', href: '/my-results' },
                    { label: 'Exam Tutor', href: '/exam-tutor' },
                    { label: 'AI Professor', href: '/ai-professor' },
                    { label: 'References', href: '/references' },
                    { label: 'Past Papers', href: '/past-papers' },
                    { label: 'Content Hub', href: '/content-hub' }
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-3xl border border-edu-border bg-edu-surface px-5 py-4 text-sm text-edu-text transition hover:border-cyan-500/40"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

            <div className="rounded-[2rem] border border-edu-border bg-edu-page p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-edu-accent">Recent activity</p>
                <div className="mt-6 space-y-4">
                  {data.activityFeed.length === 0 ? (
                    <p className="text-edu-muted">
                      No recent activity yet. Upload a lecture in Content Hub or submit an assignment to get started.
                    </p>
                  ) : (
                    data.activityFeed.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-edu-border bg-edu-surface p-4">
                      <p className="text-sm font-semibold text-edu-text">{item.title}</p>
                      <p className="mt-1 text-sm text-edu-muted">{item.subtitle}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.24em] text-edu-muted">{formatDate(item.date)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </ProtectedLayout>
  );
}
