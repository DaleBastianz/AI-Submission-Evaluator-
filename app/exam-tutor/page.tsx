'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedLayout from '../../components/ProtectedLayout';
import { apiFetch } from '../../lib/apiClient';
import MindMapChart from '../../components/MindMapChart';
import { normalizeMindMapData } from '../../lib/mindMap';

interface LectureItem {
  id: string;
  moduleName: string;
  fileName: string;
}

interface ExamOutputs {
  cheatSheet?: { sections: { title: string; points: string[] }[] } | null;
  flashcards?: { cards: { front: string; back: string }[] } | null;
  shortNotes?: { summary: string; keyPoints: string[]; definitions: { term: string; def: string }[] } | null;
  sampleExam?: { questions: { q: string; answer: string; explanation: string }[] } | null;
  mcqs?: { questions: { q: string; options: string[]; correct: string; explanation: string }[] } | null;
  mindMap?: unknown;
  examTips?: { tips: string[]; commonMistakes: string[]; timeManagement: string } | null;
}

const outputItems = [
  { id: 'cheatSheet', label: 'Cheat Sheet' },
  { id: 'flashcards', label: 'Study Flashcards' },
  { id: 'shortNotes', label: 'Short Notes' },
  { id: 'sampleExam', label: 'Sample Exam' },
  { id: 'mcqs', label: 'MCQ Quiz' },
  { id: 'mindMap', label: 'Mind Map' },
  { id: 'examTips', label: 'Exam Tips' }
];

export default function ExamTutorPage() {
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(['cheatSheet', 'shortNotes']);
  const [outputs, setOutputs] = useState<ExamOutputs | null>(null);
  const [activeTab, setActiveTab] = useState('cheatSheet');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  useEffect(() => {
    const loadLectures = async () => {
      const response = await apiFetch('/api/lectures');
      const data = await response.json();
      if (response.ok) {
        setLectures(data.lectures || []);
      }
    };

    void loadLectures();
  }, []);

  const toggleLecture = (lectureId: string) => {
    setSelectedLectureIds((current) =>
      current.includes(lectureId) ? current.filter((id) => id !== lectureId) : [...current, lectureId]
    );
  };

  const toggleOutput = (output: string) => {
    setSelectedOutputs((current) =>
      current.includes(output) ? current.filter((item) => item !== output) : [...current, output]
    );
  };

  const handleGenerate = async () => {
    setMessage('');
    setLoading(true);
    setOutputs(null);
    setShowQuizResults(false);
    setCurrentMcqIndex(0);
    setMcqAnswers({});

    try {
      if (!selectedLectureIds.length) {
        throw new Error('Select at least one lecture before generating study materials.');
      }
      if (!selectedOutputs.length) {
        throw new Error('Choose at least one output to generate.');
      }

      const response = await apiFetch('/api/exam-tutor/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureIds: selectedLectureIds, selectedOutputs })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Generation failed.');
      }
      setOutputs(result.outputs);
      setActiveTab(selectedOutputs[0] || 'cheatSheet');
    } catch (error: any) {
      setMessage(error?.message || 'Failed to generate outputs.');
    } finally {
      setLoading(false);
    }
  };

  const mcqQuestions = outputs?.mcqs?.questions ?? [];
  const currentMcq = mcqQuestions[currentMcqIndex];

  const handleAnswer = (option: string) => {
    setMcqAnswers((current) => ({ ...current, [currentMcqIndex]: option }));
  };

  const handleSubmitQuiz = () => {
    setShowQuizResults(true);
  };

  const score = useMemo(() => {
    if (!showQuizResults) return 0;
    return mcqQuestions.reduce((total, question, index) => {
      const answer = mcqAnswers[index];
      if (answer === question.correct) return total + 1;
      return total;
    }, 0);
  }, [showQuizResults, mcqAnswers, mcqQuestions]);

  const parsedMindMapData = useMemo(() => {
    if (!outputs?.mindMap) return null;
    return normalizeMindMapData(outputs.mindMap);
  }, [outputs?.mindMap]);

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Exam Tutor</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Create smart study resources from your lectures.</h1>
              <p className="mt-4 max-w-2xl text-slate-400">Choose lecture content and generate cheat sheets, flashcards, sample exams, and more for your next test.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Select lectures</p>
              <div className="mt-6 grid gap-3">
                {lectures.length === 0 ? (
                  <p className="text-slate-400">No uploaded lectures available. Add content in the Content Hub first.</p>
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
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Choose output types</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {outputItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleOutput(item.id)}
                    className={`rounded-3xl border px-4 py-4 text-left text-sm font-semibold transition ${selectedOutputs.includes(item.id) ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-950/80 text-slate-300 hover:border-cyan-400/50'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="mt-8 w-full rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Generating…' : 'Generate study pack'}
              </button>
              {message && <p className="mt-4 rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{message}</p>}
            </div>
          </div>
        </section>

        {outputs && (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {Object.keys(outputs).map((key) =>
                outputs[key as keyof ExamOutputs] ? (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === key ? 'bg-cyan-500 text-slate-950' : 'border border-white/10 text-slate-300 hover:border-cyan-400/50'}`}
                  >
                    {outputItems.find((item) => item.id === key)?.label || key}
                  </button>
                ) : null
              )}
            </div>

            <div className="space-y-6">
              {activeTab === 'cheatSheet' && outputs.cheatSheet && (
                <div>
                  <h2 className="text-2xl font-semibold text-white">Cheat Sheet</h2>
                  <div className="mt-5 space-y-4">
                    {outputs.cheatSheet.sections.map((section, index) => (
                      <div key={index} className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-5">
                        <p className="text-lg font-semibold text-white">{section.title}</p>
                        <ul className="mt-3 space-y-2 text-slate-300">
                          {section.points.map((point, idx) => (
                            <li key={idx} className="rounded-2xl bg-white/5 px-3 py-2">{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'flashcards' && outputs.flashcards && (
                <div>
                  <h2 className="text-2xl font-semibold text-white">Study Flashcards</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {outputs.flashcards.cards.map((card, index) => (
                      <div key={index} className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
                        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Front</p>
                        <p className="mt-3 text-base text-white">{card.front}</p>
                        <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Back</p>
                          <p className="mt-3 text-slate-200">{card.back}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'shortNotes' && outputs.shortNotes && (
                <div>
                  <h2 className="text-2xl font-semibold text-white">Short Notes</h2>
                  <p className="mt-4 text-slate-300">{outputs.shortNotes.summary}</p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Key Points</p>
                      <ul className="mt-4 space-y-2 text-slate-300">
                        {outputs.shortNotes.keyPoints.map((point, idx) => (
                          <li key={idx} className="rounded-2xl bg-white/5 px-3 py-2">{point}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Definitions</p>
                      <div className="mt-4 space-y-3 text-slate-300">
                        {outputs.shortNotes.definitions.map((item, idx) => (
                          <div key={idx} className="rounded-2xl bg-white/5 p-3">
                            <p className="font-semibold text-white">{item.term}</p>
                            <p className="mt-1 text-sm">{item.def}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sampleExam' && outputs.sampleExam && (
                <div>
                  <h2 className="text-2xl font-semibold text-white">Sample Exam</h2>
                  <div className="mt-5 space-y-4">
                    {outputs.sampleExam.questions.map((question, index) => (
                      <div key={index} className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-6">
                        <p className="text-base font-semibold text-white">Q{index + 1}. {question.q}</p>
                        <p className="mt-3 text-slate-300"><span className="font-semibold text-white">Answer:</span> {question.answer}</p>
                        <p className="mt-2 text-sm text-slate-400">{question.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'mcqs' && outputs.mcqs && (
                <div>
                  <h2 className="text-2xl font-semibold text-white">MCQ Quiz</h2>
                  {mcqQuestions.length === 0 ? (
                    <p className="mt-4 text-slate-300">No MCQ questions available.</p>
                  ) : showQuizResults ? (
                    <div className="mt-6 rounded-3xl border border-white/10 bg-[#08111c]/90 p-6">
                      <p className="text-lg font-semibold text-white">Quiz Results</p>
                      <p className="mt-3 text-slate-300">Score: {score} / {mcqQuestions.length}</p>
                      <div className="mt-6 space-y-4">
                        {mcqQuestions.map((question, index) => {
                          const answer = mcqAnswers[index];
                          const correct = question.correct;
                          return (
                            <div key={index} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                              <p className="font-semibold text-white">Q{index + 1}. {question.q}</p>
                              <p className="mt-3 text-sm text-slate-300">Your answer: <span className={answer === correct ? 'text-emerald-400' : 'text-rose-400'}>{answer || 'No answer'}</span></p>
                              <p className="text-sm text-slate-400">Correct: {correct}</p>
                              <p className="mt-3 text-sm text-slate-300">{question.explanation}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-3xl border border-white/10 bg-[#08111c]/90 p-6">
                      <p className="text-base font-semibold text-white">Question {currentMcqIndex + 1} of {mcqQuestions.length}</p>
                      <p className="mt-4 text-slate-300">{currentMcq.q}</p>
                      <div className="mt-5 grid gap-3">
                        {currentMcq.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleAnswer(option)}
                            className={`w-full rounded-3xl border px-4 py-4 text-left text-sm transition ${mcqAnswers[currentMcqIndex] === option ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-950/80 text-slate-300 hover:border-cyan-400/50'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentMcqIndex((idx) => Math.max(0, idx - 1))}
                          disabled={currentMcqIndex === 0}
                          className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentMcqIndex((idx) => Math.min(mcqQuestions.length - 1, idx + 1))}
                          disabled={currentMcqIndex === mcqQuestions.length - 1}
                          className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitQuiz}
                          className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          Submit quiz
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'mindMap' && outputs.mindMap != null && (
                <div>
                  <h2 className="text-2xl font-semibold text-white">Mind Map</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Interactive radial chart — hover branches to highlight, zoom with +/−, or download as PNG.
                  </p>
                  {parsedMindMapData ? (
                    <div className="mt-6">
                      <MindMapChart data={parsedMindMapData} />
                    </div>
                  ) : (
                    <div className="mt-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 px-6 py-8 text-center">
                      <p className="text-lg font-medium text-amber-200">
                        Mind map could not be generated. Try regenerating the study pack.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'examTips' && outputs.examTips && (
                <div>
                  <h2 className="text-2xl font-semibold text-white">Exam Tips</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Tips</p>
                      <ul className="mt-4 space-y-2 text-slate-300">
                        {outputs.examTips.tips.map((tip, idx) => (
                          <li key={idx} className="rounded-2xl bg-white/5 px-3 py-2">{tip}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Common Mistakes</p>
                      <ul className="mt-4 space-y-2 text-slate-300">
                        {outputs.examTips.commonMistakes.map((item, idx) => (
                          <li key={idx} className="rounded-2xl bg-white/5 px-3 py-2">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-[#08111c]/90 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Time Management</p>
                      <p className="mt-4 text-slate-300">{outputs.examTips.timeManagement}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </ProtectedLayout>
  );
}
