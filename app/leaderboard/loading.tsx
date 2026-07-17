// app/leaderboard/loading.tsx
// Neo-Brutalism skeleton shown while leaderboard data is fetched.

export default function LeaderboardLoading() {
  return (
    <main className="max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-8 pb-24">
      {/* ─── Header skeleton ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-40 bg-ink/10 rounded-[4px] animate-pulse" />
          <div className="h-3 w-64 bg-ink/6 rounded-[4px] animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-highlighter/40 border-[3px] border-ink rounded-[4px] animate-pulse" />
      </div>

      <hr className="border-t-[3px] border-ink" />

      {/* ─── Tab skeleton ────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-9 w-20 bg-ink/8 rounded-[4px] animate-pulse"
          />
        ))}
      </div>

      {/* ─── Row skeletons ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-paper border-[3px] border-ink rounded-[4px] shadow-brutal p-4 flex items-center gap-4"
            style={{ opacity: 1 - i * 0.08 }}
          >
            {/* Rank */}
            <div className="h-6 w-6 bg-ink/10 rounded-[4px] animate-pulse flex-shrink-0" />
            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-ink/10 animate-pulse flex-shrink-0" />
            {/* Name */}
            <div className="flex-1 h-4 bg-ink/10 rounded-[4px] animate-pulse max-w-[180px]" />
            {/* Score */}
            <div className="h-5 w-14 bg-ink/6 rounded-[4px] animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
