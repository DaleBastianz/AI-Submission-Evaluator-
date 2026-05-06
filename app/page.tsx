import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 flex flex-col gap-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-slate-950/80 to-slate-900/70 p-10 shadow-glow">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                AI evaluation for submissions
              </p>
              <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                Your smart assignment submission portal with AI scoring.
              </h1>
              <p className="mt-6 max-w-2xl text-slate-300 sm:text-lg">
                Submit texts, PDFs, DOCX files or links, then get instant AI feedback on understanding,
                code quality, completeness and real-world applicability.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-slate-300">
              <span>Built with:</span>
              <div className="flex flex-wrap gap-3">
                {['Next.js', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'Gemini'].map((tech) => (
                  <span key={tech} className="rounded-full border border-slate-600/70 bg-white/5 px-4 py-2">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/submit-assignment" className="rounded-3xl bg-cyan-500 px-6 py-4 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Submit assignment
            </Link>
            <Link href="/my-results" className="rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-4 text-center text-sm text-slate-200 transition hover:border-cyan-500/40">
              View my results
            </Link>
            <Link href="/admin" className="rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-4 text-center text-sm text-slate-200 transition hover:border-cyan-500/40">
              Admin dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Fast AI scoring',
              description: 'Let the engine score and grade every assignment automatically.'
            },
            {
              title: 'File + link support',
              description: 'Upload PDF/DOCX or submit a GitHub / web URL for evaluation.'
            },
            {
              title: 'Actionable feedback',
              description: 'Strengths, weaknesses, and improvements are surfaced instantly.'
            }
          ].map((card) => (
            <div key={card.title} className="glass-panel rounded-[1.75rem] p-6 shadow-xl">
              <h2 className="mb-3 text-xl font-semibold text-white">{card.title}</h2>
              <p className="text-slate-300">{card.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
