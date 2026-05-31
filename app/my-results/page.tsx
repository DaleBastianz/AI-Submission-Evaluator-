'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../components/Providers';
import { apiFetch } from '../../lib/apiClient';
import ProtectedLayout from '../../components/ProtectedLayout';

const gradeMap: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-cyan-500',
  C: 'bg-amber-400',
  D: 'bg-orange-500',
  F: 'bg-red-500'
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
}

export default function MyResultsPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const fetchResults = async () => {
    if (!session?.user) return;
    setLoading(true);
    setMessage('');

    try {
      const response = await apiFetch('/api/results');
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Could not load results.');
      setSubmissions(result.submissions ?? []);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to load your submissions.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchResults();
  }, [session]);

  const totalText = useMemo(() => {
    if (!submissions.length) return 'No submissions yet.';
    return `${submissions.length} submission${submissions.length === 1 ? '' : 's'} found.`;
  }, [submissions.length]);

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
          <div className="mb-10 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">My Results Dashboard</p>
                <h1 className="mt-2 text-4xl font-semibold text-white">Review your assignment history.</h1>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-6">
                <p className="text-sm text-slate-400">Total submissions</p>
                <p className="mt-3 text-3xl font-semibold text-white">{submissions.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-6">
                <p className="text-sm text-slate-400">Last updated</p>
                <p className="mt-3 text-3xl font-semibold text-white">{submissions[0] ? formatDate(submissions[0].createdAt) : 'N/A'}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-6">
                <p className="text-sm text-slate-400">Current user</p>
                <p className="mt-3 text-3xl font-semibold text-white">{session?.user?.name || session?.user?.email}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400">{totalText}</p>
            {loading && <p className="mt-4 rounded-3xl bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100">Loading your results…</p>}
            {message && <p className="mt-4 rounded-3xl bg-red-500/10 px-5 py-3 text-sm text-red-200">{message}</p>}
          </div>

          <div className="space-y-6">
            {submissions.map((submission, index) => {
              const active = activeIndex === index;
              const criteria = submission.aiFeedback?.criteria ?? {};

              return (
                <div key={submission.id} className="glass-panel rounded-[2rem] border border-white/10 p-6 shadow-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{submission.title}</p>
                      <p className="text-slate-300">Submitted {formatDate(submission.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">{submission.type.toUpperCase()}</div>
                      <div className="rounded-full px-4 py-2 text-sm font-semibold text-slate-950" style={{ backgroundColor: gradeMap[submission.aiGrade] ?? '#334155' }}>
                        {submission.aiGrade || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl bg-slate-900/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4 text-sm text-slate-300">
                      <span>Score</span>
                      <span>{submission.aiScore ?? 0}/100</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${submission.aiScore ?? 0}%` }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveIndex(active ? null : index)}
                    className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50"
                  >
                    {active ? 'Hide details' : 'Show feedback'}
                  </button>

                  {active && (
                    <div className="mt-6 space-y-6">
                      <div className="grid gap-4 lg:grid-cols-3">
                        {['strengths', 'weaknesses', 'improvements'].map((section) => (
                          <div key={section} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{section}</p>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {(submission.aiFeedback?.[section] ?? []).map((item: string, idx: number) => (
                                <li key={idx} className="rounded-2xl bg-white/5 px-3 py-2">{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Criteria breakdown</p>
                        <div className="space-y-4">
                          {Object.entries(criteria).map(([key, value]) => {
                            const numericValue = Number(value) || 0;
                            return (
                              <div key={key}>
                                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                                  <span>{key.replace('_', ' ')}</span>
                                  <span>{numericValue}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${numericValue}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      </div>
    </ProtectedLayout>
  );
}
