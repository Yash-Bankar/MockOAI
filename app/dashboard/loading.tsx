// app/dashboard/loading.tsx
// Neo-Brutalism skeleton shown while getDashboardData() is running on the server.

export default function DashboardLoading() {
  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
      {/* ─── Header skeleton ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-ink/10 rounded-[4px] animate-pulse" />
          <div className="h-4 w-64 bg-ink/6 rounded-[4px] animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 bg-ink/10 rounded-[4px] animate-pulse" />
          <div className="h-8 w-24 bg-ink/10 rounded-[4px] animate-pulse" />
        </div>
      </div>

      {/* ─── Stat cards skeleton ──────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-paper border-[3px] border-ink rounded-[4px] shadow-brutal p-5 flex flex-col items-center gap-2"
          >
            <div className="h-7 w-16 bg-ink/10 rounded-[4px] animate-pulse" />
            <div className="h-3 w-20 bg-ink/6 rounded-[4px] animate-pulse" />
          </div>
        ))}
      </section>

      {/* ─── CTA card skeleton ───────────────────────────────────────── */}
      <section>
        <div className="bg-paper border-[3px] border-ink rounded-[4px] shadow-brutal p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-5 w-48 bg-ink/10 rounded-[4px] animate-pulse" />
            <div className="h-3 w-72 bg-ink/6 rounded-[4px] animate-pulse" />
          </div>
          <div className="h-12 w-44 bg-highlighter/50 border-[3px] border-ink rounded-[4px] animate-pulse" />
        </div>
      </section>

      {/* ─── Recent attempts skeleton ─────────────────────────────────── */}
      <section>
        <div className="h-7 w-44 bg-ink/10 rounded-[4px] animate-pulse mb-5" />
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-paper border-[3px] border-ink rounded-[4px] shadow-brutal p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
            >
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-40 bg-ink/10 rounded-[4px] animate-pulse" />
                <div className="h-3 w-24 bg-ink/6 rounded-[4px] animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-ink/10 rounded-[4px] animate-pulse" />
              <div className="h-8 w-24 bg-ink/6 rounded-[4px] animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
