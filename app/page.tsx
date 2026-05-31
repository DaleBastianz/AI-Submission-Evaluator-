import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-edu-page px-6 py-10 text-edu-text">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex flex-col gap-8 rounded-[2rem] border border-edu-border bg-edu-surface p-10 shadow-glow">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-edu-accent">
              EduAI Learning Management System
            </p>
            <h1 className="text-4xl font-semibold text-edu-text sm:text-5xl">
              AI-powered study tools for assignments, exams, and lectures.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-edu-muted">
              Submit work for AI grading, upload lectures, chat with an AI professor, generate exam prep, find video
              references, and practice past papers — all in one student workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/register"
              className="rounded-3xl bg-cyan-500 px-6 py-4 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="rounded-3xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-4 text-center text-sm font-semibold text-edu-accent transition hover:bg-cyan-500/20"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-3xl border border-edu-border px-6 py-4 text-center text-sm text-edu-text transition hover:border-cyan-500/40"
            >
              Open dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Submit Assignment',
              description: 'Upload text, files, or links and receive instant AI scores and feedback.',
              href: '/submit-assignment'
            },
            {
              title: 'Exam Tutor',
              description: 'Generate cheat sheets, flashcards, sample exams, and study notes from your lectures.',
              href: '/exam-tutor'
            },
            {
              title: 'AI Professor',
              description: 'Ask questions grounded in your uploaded lecture materials.',
              href: '/ai-professor'
            },
            {
              title: 'Content Hub',
              description: 'Upload and manage lecture PDFs, slides, and course files.',
              href: '/content-hub'
            },
            {
              title: 'References',
              description: 'Discover curated YouTube videos matched to your lecture topics.',
              href: '/references'
            },
            {
              title: 'Past Papers',
              description: 'Upload past papers and get AI-generated answers with mark scheme hints.',
              href: '/past-papers'
            }
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="glass-panel rounded-[1.75rem] p-6 shadow-xl transition hover:border-cyan-500/30"
            >
              <h2 className="mb-3 text-xl font-semibold text-edu-text">{card.title}</h2>
              <p className="text-edu-muted">{card.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
