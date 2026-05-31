'use client';

import { useEffect, useState } from 'react';
import ProtectedLayout from '../../components/ProtectedLayout';
import { apiFetch } from '../../lib/apiClient';

interface LectureItem {
  id: string;
  moduleName: string;
  fileName: string;
}

interface ChatMessage {
  role: 'student' | 'assistant';
  message: string;
  source?: string;
  confidence?: string;
}

export default function AIProfessorPage() {
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLectures = async () => {
      const response = await apiFetch('/api/lectures');
      const data = await response.json();
      if (response.ok) {
        setLectures(data.lectures || []);
        setSelectedLectureIds(data.lectures?.slice(0, 1).map((item: LectureItem) => item.id) || []);
      }
    };
    void loadLectures();
  }, []);

  const toggleLecture = (lectureId: string) => {
    setSelectedLectureIds((current) =>
      current.includes(lectureId) ? current.filter((id) => id !== lectureId) : [...current, lectureId]
    );
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    if (!selectedLectureIds.length) {
      setError('Select at least one lecture to ask the AI professor.');
      return;
    }

    setError('');
    setLoading(true);

    const nextMessages: ChatMessage[] = [...messages, { role: 'student', message: question.trim() }];
    setMessages(nextMessages);
    setQuestion('');

    try {
      const response = await apiFetch('/api/ai-professor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureIds: selectedLectureIds, question: question.trim(), chatHistory: nextMessages })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Professor request failed.');
      }
      setMessages((current) => [...current, { role: 'assistant', message: result.answer, source: result.source, confidence: result.confidence }]);
    } catch (err: any) {
      setError(err?.message || 'Failed to get answer from AI Professor.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">AI Professor</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Ask the professor about your lecture content.</h1>
              <p className="mt-4 max-w-2xl text-slate-400">The AI answers using only your uploaded lectures and cites which document it used for the response.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Lecture selection</p>
              <div className="mt-6 space-y-3">
                {lectures.length === 0 ? (
                  <p className="text-slate-400">Upload lectures first in the Content Hub.</p>
                ) : (
                  lectures.map((lecture) => (
                    <button
                      key={lecture.id}
                      type="button"
                      onClick={() => toggleLecture(lecture.id)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${selectedLectureIds.includes(lecture.id) ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-950/80 text-slate-300 hover:border-cyan-400/50'}`}
                    >
                      <p className="font-semibold">{lecture.fileName}</p>
                      <p className="mt-1 text-sm text-slate-400">{lecture.moduleName}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Professor chat</p>
                <button type="button" onClick={clearChat} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50">
                  Clear chat
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/80 p-8 text-center text-slate-400">Ask your first question to get a lecture-based answer.</div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className={`rounded-[2rem] p-5 shadow-sm ${message.role === 'assistant' ? 'bg-slate-900/80 border border-white/10' : 'bg-white/5 border border-white/10'}`}>
                      <p className="text-sm font-semibold text-white uppercase tracking-[0.18em]">{message.role === 'assistant' ? 'Professor' : 'You'}</p>
                      <p className="mt-3 text-slate-200 whitespace-pre-wrap">{message.message}</p>
                      {message.role === 'assistant' && (message.source || message.confidence) && (
                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                          {message.source && <span className="rounded-full bg-white/5 px-3 py-2">Source: {message.source}</span>}
                          {message.confidence && <span className="rounded-full bg-white/5 px-3 py-2">Confidence: {message.confidence}</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-4">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  className="w-full rounded-[2rem] border border-white/10 bg-slate-950/80 px-4 py-4 text-white outline-none transition focus:border-cyan-500/70"
                  placeholder="Write your lecture question here..."
                />
                {error && <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
                <button
                  type="button"
                  onClick={handleAsk}
                  disabled={loading}
                  className="w-full rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Thinking…' : 'Ask Professor'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ProtectedLayout>
  );
}
