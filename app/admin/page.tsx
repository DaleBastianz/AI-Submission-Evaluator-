'use client';

import { useEffect, useMemo, useState } from 'react';

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

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ type: '', minScore: '', maxScore: '', startDate: '', endDate: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [overrideState, setOverrideState] = useState<{ [key: string]: { grade: string; score: number } }>({});

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.minScore) params.set('minScore', filters.minScore);
    if (filters.maxScore) params.set('maxScore', filters.maxScore);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (password) params.set('password', password);
    return params.toString();
  }, [filters, password]);

  useEffect(() => {
    if (!authenticated) return;
    if (password) {
      void loadSubmissions();
    }
  }, [authenticated, query]);

  const loadSubmissions = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/submissions?${query}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Unable to load submissions.');
      setSubmissions(result.submissions || []);
      const initialOverride = result.submissions?.reduce((acc: any, item: any) => {
        acc[item.id] = { grade: item.aiGrade || 'A', score: item.aiScore ?? 0 };
        return acc;
      }, {});
      setOverrideState(initialOverride || {});
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load admin data.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthenticated(true);
    await loadSubmissions();
  };

  const handleOverride = async (submissionId: string) => {
    const override = overrideState[submissionId];
    if (!override) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/override', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, submissionId, grade: override.grade, score: override.score })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Override failed.');
      await loadSubmissions();
      setMessage('Grade override saved successfully.');
    } catch (error: any) {
      setMessage(error?.message || 'Override update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Admin panel</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Manage all submissions and override grades.</h1>
            </div>
          </div>

          {!authenticated ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4 sm:flex-row">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Admin password"
                className="flex-1 rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-white outline-none transition focus:border-cyan-500/70"
              />
              <button type="submit" className="rounded-3xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400">
                Unlock admin
              </button>
            </form>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Type</span>
                <select value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))} className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none">
                  <option value="">Any</option>
                  <option value="text">Text</option>
                  <option value="file">File</option>
                  <option value="link">Link</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Min score</span>
                <input type="number" min="0" max="100" value={filters.minScore} onChange={(event) => setFilters((prev) => ({ ...prev, minScore: event.target.value }))} className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Max score</span>
                <input type="number" min="0" max="100" value={filters.maxScore} onChange={(event) => setFilters((prev) => ({ ...prev, maxScore: event.target.value }))} className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Start date</span>
                <input type="date" value={filters.startDate} onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))} className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">End date</span>
                <input type="date" value={filters.endDate} onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))} className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none" />
              </label>
              <button type="button" onClick={loadSubmissions} className="rounded-3xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400">
                Apply filters
              </button>
            </div>
          )}

          {message && <p className="mt-4 rounded-3xl bg-red-500/10 px-5 py-3 text-sm text-red-200">{message}</p>}
        </div>

        {authenticated && (
          <div className="space-y-6">
            {loading && <div className="rounded-[2rem] border border-cyan-500/20 bg-cyan-500/10 p-6 text-sm text-cyan-100">Loading submissions…</div>}
            <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-slate-950/80">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
                <thead className="bg-slate-950/90 text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-white/5">
                      <td className="px-6 py-4">{submission.name}</td>
                      <td className="px-6 py-4">{submission.email}</td>
                      <td className="px-6 py-4">{submission.title}</td>
                      <td className="px-6 py-4">{submission.type}</td>
                      <td className="px-6 py-4">{submission.aiScore ?? '–'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${gradeMap[submission.aiGrade] ?? 'bg-slate-600'}`}>
                          {submission.aiGrade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatDate(submission.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/60"
                        >
                          {expandedId === submission.id ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {submissions.map((submission) => {
              if (expandedId !== submission.id) return null;
              const override = overrideState[submission.id] || { grade: submission.aiGrade || 'A', score: submission.aiScore ?? 0 };

              return (
                <div key={`${submission.id}-detail`} className="glass-panel rounded-[2rem] border border-white/10 p-6 shadow-xl">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-sm uppercase tracking-[0.18em] text-slate-400">AI feedback</p>
                        <p className="text-slate-300">{submission.aiFeedback?.final_feedback || 'No feedback available.'}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {['plagiarism_flag', 'ai_generated_flag'].map((flag) => (
                          <div key={flag} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
                            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">{flag.replace('_', ' ')}</span>
                            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${submission.aiFeedback?.[flag] ? 'bg-red-500/20 text-red-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
                              {submission.aiFeedback?.[flag] ? 'Yes' : 'No'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-6">
                      <p className="mb-4 text-sm uppercase tracking-[0.18em] text-slate-400">Grade override</p>
                      <label className="block">
                        <span className="mb-2 text-sm text-slate-300">Grade</span>
                        <select
                          value={override.grade}
                          onChange={(event) => setOverrideState((prev) => ({ ...prev, [submission.id]: { ...override, grade: event.target.value } }))}
                          className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        >
                          {['A', 'B', 'C', 'D', 'F'].map((grade) => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </label>
                      <label className="mt-4 block">
                        <span className="mb-2 text-sm text-slate-300">Score</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={override.score}
                          onChange={(event) => setOverrideState((prev) => ({ ...prev, [submission.id]: { ...override, score: Number(event.target.value) } }))}
                          className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOverride(submission.id)}
                        className="mt-5 rounded-3xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400"
                      >
                        Save override
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
