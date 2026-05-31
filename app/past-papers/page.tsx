'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import ProtectedLayout from '../../components/ProtectedLayout';
import { apiFetch } from '../../lib/apiClient';

interface LectureItem {
  id: string;
  moduleName: string;
  fileName: string;
}

interface PastPaperQuestion {
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  markSchemeHints: string[];
  relatedTopics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  lectureReference: string | null;
}

interface PastPaperRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export default function PastPapersPage() {
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PastPaperQuestion[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<PastPaperRecord[]>([]);

  useEffect(() => {
    const loadLectures = async () => {
      const response = await apiFetch('/api/lectures');
      const data = await response.json();
      if (response.ok) {
        setLectures(data.lectures || []);
        setSelectedLectureIds(data.lectures?.slice(0, 1).map((item: LectureItem) => item.id) || []);
      }
    };
    const loadHistory = async () => {
      const response = await apiFetch('/api/past-papers/history');
      const data = await response.json();
      if (response.ok) {
        setHistory(data.papers || []);
      }
    };
    void loadLectures();
    void loadHistory();
  }, []);

  const toggleLecture = (lectureId: string) => {
    setSelectedLectureIds((current) =>
      current.includes(lectureId) ? current.filter((id) => id !== lectureId) : [...current, lectureId]
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setQuestionText('');
  };

  const handleSubmit = async () => {
    setMessage('');
    setLoading(true);
    setResults([]);
    setExpandedIndex(null);

    try {
      if (!file && !questionText.trim()) {
        throw new Error('Upload a past paper or type a question.');
      }
      if (!selectedLectureIds.length) {
        throw new Error('Select at least one lecture for cross-reference.');
      }

      let response: Response;
      if (file) {
        const formData = new FormData();
        formData.append('lectureIds', JSON.stringify(selectedLectureIds));
        formData.append('pastPaperFile', file);
        response = await apiFetch('/api/past-papers/solve', { method: 'POST', body: formData });
      } else {
        response = await apiFetch('/api/past-papers/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lectureIds: selectedLectureIds, questionText: questionText.trim() })
        });
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Past paper solving failed.');
      }

      const questions = result.aiAnswers?.questions || [];
      setResults(questions);
      setMessage('Solved past paper questions.');
      setHistory((current) => result.pastPaper ? [result.pastPaper, ...current] : current);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to solve the past paper.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Past Paper AI</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Solve questions from past papers and lecture notes.</h1>
              <p className="mt-4 max-w-2xl text-slate-400">Upload a past exam paper or type a question manually, then get concise answers, mark scheme hints, and related topics.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Upload or ask</p>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Upload past paper</span>
                  <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="text-sm text-slate-300" />
                </label>
                <p className="text-sm text-slate-400">Or type a single manual exam question below.</p>
                <textarea
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  rows={5}
                  className="w-full rounded-[2rem] border border-white/10 bg-slate-950/80 px-4 py-4 text-white outline-none transition focus:border-cyan-500/70"
                  placeholder="Type a question to solve manually..."
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Lecture support</p>
              <div className="mt-6 grid gap-3">
                {lectures.length === 0 ? (
                  <p className="text-slate-400">Upload lectures first to enable cross-referencing.</p>
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
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="mt-8 w-full rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Solving…' : 'Solve past paper'}
              </button>
              {message && <p className="mt-4 rounded-3xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}
            </div>
          </div>
        </section>

        {results.length > 0 && (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Results</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Solved questions</h2>
              </div>
            </div>
            <div className="space-y-4">
              {results.map((question, index) => (
                <div key={index} className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">Q{index + 1}. {question.question}</p>
                      <p className="mt-2 text-sm text-slate-400">Difficulty: <span className={`rounded-full px-3 py-1 text-xs uppercase ${question.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-200' : question.difficulty === 'medium' ? 'bg-amber-400/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>{question.difficulty}</span></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
                    >
                      {expandedIndex === index ? 'Hide details' : 'Show detailed'}
                    </button>
                  </div>
                  <div className="mt-5 text-slate-300">
                    <p><span className="font-semibold text-white">Short answer:</span> {question.shortAnswer}</p>
                    {expandedIndex === index && (
                      <div className="mt-4 space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                        <div>
                          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Detailed answer</p>
                          <p className="mt-2 text-slate-200">{question.detailedAnswer}</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Mark scheme hints</p>
                          <ul className="mt-2 space-y-2 text-slate-300">
                            {question.markSchemeHints.map((hint, hintIndex) => (
                              <li key={hintIndex} className="rounded-2xl bg-white/5 px-3 py-2">{hint}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Related topics</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {question.relatedTopics.map((topic, topicIndex) => (
                              <span key={topicIndex} className="rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">{topic}</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400">Lecture reference: {question.lectureReference || 'None'}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">History</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Past papers solved</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {history.map((paper) => (
                paper.fileUrl && paper.fileUrl.startsWith('http') ? (
                  <a key={paper.id} href={paper.fileUrl} target="_blank" rel="noreferrer" className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6 transition hover:border-cyan-400/50">
                    <p className="text-lg font-semibold text-white">{paper.fileName}</p>
                    <p className="mt-3 text-sm text-slate-400">Solved {new Date(paper.createdAt).toLocaleDateString()}</p>
                  </a>
                ) : (
                  <div key={paper.id} className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
                    <p className="text-lg font-semibold text-white">{paper.fileName}</p>
                    <p className="mt-3 text-sm text-slate-400">Solved {new Date(paper.createdAt).toLocaleDateString()}</p>
                  </div>
                )
              ))}
            </div>
          </section>
        )}
      </div>
    </ProtectedLayout>
  );
}
