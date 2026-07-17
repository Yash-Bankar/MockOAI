// app/profile/loading.tsx
// Neo-Brutalism skeleton shown while getProfileData() runs on the server.

export default function ProfileLoading() {
  return (
    <main className="max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
      {/* ─── Header skeleton ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-24 bg-ink/10 rounded-[4px] animate-pulse" />
          <div className="h-3 w-48 bg-ink/6 rounded-[4px] animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-ink/10 border-[3px] border-ink rounded-[4px] animate-pulse" />
      </div>

      {/* ─── Stats skeleton ───────────────────────────────────────────── */}
      <section>
        <div className="h-6 w-24 bg-ink/10 rounded-[4px] animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-paper border-[3px] border-ink rounded-[4px] shadow-brutal p-5 flex flex-col items-center gap-2"
            >
              <div className="h-7 w-14 bg-ink/10 rounded-[4px] animate-pulse" />
              <div className="h-3 w-16 bg-ink/6 rounded-[4px] animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Edit form skeleton ───────────────────────────────────────── */}
      <section>
        <div className="h-6 w-28 bg-ink/10 rounded-[4px] animate-pulse mb-4" />
        <div className="bg-paper border-[3px] border-ink rounded-[4px] shadow-brutal p-5 flex flex-col gap-4">
          {/* Field skeletons */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-3.5 w-24 bg-ink/10 rounded-[4px] animate-pulse" />
              <div className="h-10 w-full bg-ink/6 border-[3px] border-ink/20 rounded-[4px] animate-pulse" />
            </div>
          ))}
          <div className="h-10 w-32 bg-highlighter/50 border-[3px] border-ink rounded-[4px] animate-pulse mt-2" />
        </div>
      </section>
    </main>
  );
}
