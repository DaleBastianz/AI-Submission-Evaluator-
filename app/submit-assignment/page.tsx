'use client';

import { useMemo, useState } from 'react';

const gradeColor = {
  A: 'bg-emerald-500 text-slate-950',
  B: 'bg-cyan-500 text-slate-950',
  C: 'bg-amber-400 text-slate-950',
  D: 'bg-orange-500 text-slate-950',
  F: 'bg-red-500 text-slate-950'
};

const fileTypes = ['pdf', 'docx'];

export default function SubmitAssignmentPage() {
  const [assignmentType, setAssignmentType] = useState<'text' | 'file' | 'link'>('text');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);

  const assignmentPayload = useMemo(() => {
    if (assignmentType === 'text') return { label: 'Submission text', placeholder: 'Paste your assignment description or code...' };
    if (assignmentType === 'file') return { label: 'Upload file', placeholder: 'Drag a file here or click to select' };
    return { label: 'Assignment link', placeholder: 'https://github.com/your-project or https://...' };
  }, [assignmentType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    setFile(droppedFile);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setResponseData(null);
    setLoading(true);

    try {
      if (!name || !email || !title) {
        throw new Error('Name, email, and assignment title are required.');
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('title', title);
      formData.append('type', assignmentType);

      if (assignmentType === 'text') {
        if (!message.trim()) {
          throw new Error('Please provide the assignment text.');
        }
        formData.append('contentText', message);
      }

      if (assignmentType === 'file') {
        if (!file) {
          throw new Error('Please select a file to upload.');
        }
        formData.append('assignmentFile', file);
      }

      if (assignmentType === 'link') {
        if (!link.trim()) {
          throw new Error('Please provide a link.');
        }
        formData.append('link', link);
      }

      const response = await fetch('/api/submit-assignment', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Submission failed.');
      }

      setResponseData(result.feedback || result);
      setMessage('');
      setFile(null);
      setLink('');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to submit assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Assignment Submission Portal</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Submit your work and get instant AI evaluation.</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/" className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:border-cyan-400/60">Home</a>
              <a href="/my-results" className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:border-cyan-400/60">My Results</a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { label: 'Name', value: name, setter: setName },
                { label: 'Email', value: email, setter: setEmail, type: 'email' }
              ].map((field) => (
                <label key={field.label} className="block"> 
                  <span className="mb-2 block text-sm font-medium text-slate-300">{field.label}</span>
                  <input
                    type={field.type || 'text'}
                    value={field.value}
                    onChange={(event) => field.setter(event.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/70"
                  />
                </label>
              ))}
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Assignment Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/70"
              />
            </label>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Assignment Type</p>
              <div className="flex flex-wrap gap-3">
                {['text', 'file', 'link'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAssignmentType(option as 'text' | 'file' | 'link')}
                    className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${assignmentType === option ? 'bg-cyan-500 text-slate-950' : 'border border-white/10 text-slate-300 hover:border-cyan-400/50'}`}
                  >
                    {option === 'text' ? 'Text' : option === 'file' ? 'File' : 'Link'}
                  </button>
                ))}
              </div>
            </div>

            {assignmentType === 'text' && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">{assignmentPayload.label}</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={10}
                  className="w-full rounded-[2rem] border border-white/10 bg-slate-950/80 px-4 py-4 text-white outline-none transition focus:border-cyan-500/70"
                  placeholder={assignmentPayload.placeholder}
                />
              </label>
            )}

            {assignmentType === 'file' && (
              <div>
                <p className="mb-3 text-sm font-medium text-slate-300">{assignmentPayload.label}</p>
                <div
                  onDrop={handleDrop}
                  onDragOver={(event) => event.preventDefault()}
                  className="glass-panel rounded-[2rem] border border-white/10 p-8 text-center text-slate-300 transition hover:border-cyan-400/50"
                >
                  <label className="cursor-pointer">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-3xl text-cyan-300">
                      ⬆
                    </div>
                    <p className="text-sm">{file ? file.name : assignmentPayload.placeholder}</p>
                    <input type="file" accept="*/*" onChange={handleFileChange} className="sr-only" />
                  </label>
                  <p className="mt-3 text-xs text-slate-500">Supports PDF, DOCX, TXT, Markdown, HTML, code files, and plain text formats.</p>
                </div>
              </div>
            )}

            {assignmentType === 'link' && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">{assignmentPayload.label}</span>
                <input
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/70"
                  placeholder={assignmentPayload.placeholder}
                />
              </label>
            )}

            {message && <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{message}</div>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Evaluating...' : 'Submit assignment'}
            </button>
          </form>
        </div>

        {responseData && (
          <section className="glass-panel rounded-[2rem] border border-white/10 p-8 shadow-xl">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Evaluation score</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{responseData.score}/100</h2>
              </div>
              <span
                className={`rounded-full px-5 py-3 text-sm font-semibold ${gradeColor[responseData.grade as keyof typeof gradeColor] ?? 'bg-slate-600 text-white'}`}
              >
                {responseData.grade}
              </span>
            </div>
            <p className="mb-6 text-slate-300">{responseData.final_feedback}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {['strengths', 'weaknesses', 'improvements'].map((key) => (
                <div key={key} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{key}</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {((Array.isArray(responseData[key]) ? responseData[key] : []) as string[]).map((item: string, index: number) => (
                      <li key={index} className="rounded-2xl bg-white/5 px-3 py-2">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
