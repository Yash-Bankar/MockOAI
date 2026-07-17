// app/exam/[attemptId]/results/loading.tsx
// Shown while the results page.tsx runs its server-side data fetching.
// Styled to match the results page (dark neo-brutalism palette).

export default function ResultsLoading() {
  return (
    <div className="min-h-screen bg-[#F0F0F0] text-black p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* ─── Header skeleton ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <div className="h-10 w-64 bg-black/10 rounded animate-pulse" />
            <div className="h-4 w-40 bg-black/6 rounded animate-pulse" />
          </div>
          <div className="h-11 w-36 bg-black/10 border-4 border-black/20 rounded animate-pulse" />
        </div>

        {/* ─── Score + Status cards ──────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          {/* Big score card */}
          <div className="w-full md:w-1/3 h-40 bg-black/10 border-4 border-black/20 shadow-[8px_8px_0px_rgba(0,0,0,0.15)] rounded animate-pulse flex flex-col items-center justify-center gap-3">
            <div className="h-4 w-20 bg-black/10 rounded" />
            <div className="h-14 w-32 bg-black/10 rounded" />
          </div>

          {/* Status + Time cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="h-40 bg-white border-4 border-black/20 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] rounded animate-pulse flex flex-col justify-center gap-3 px-6">
              <div className="h-4 w-16 bg-black/10 rounded" />
              <div className="h-8 w-28 bg-black/10 rounded" />
            </div>
            <div className="h-40 bg-blue-400/30 border-4 border-black/20 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] rounded animate-pulse flex flex-col justify-center gap-3 px-6">
              <div className="h-4 w-20 bg-blue-400/30 rounded" />
              <div className="h-8 w-32 bg-blue-400/30 rounded" />
            </div>
          </div>
        </div>

        {/* ─── Chart cards skeleton ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white border-4 border-black/20 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] rounded p-5 flex flex-col items-center h-[300px] animate-pulse"
            >
              <div className="h-5 w-36 bg-black/10 rounded self-start mb-6" />
              <div className="w-44 h-44 rounded-full border-[14px] border-black/8 flex items-center justify-center">
                <div className="h-5 w-12 bg-black/10 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* ─── Section breakdown skeleton ───────────────────────────── */}
        <div>
          <div className="h-7 w-52 bg-black/10 rounded animate-pulse mb-5" />
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white border-4 border-black/20 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] rounded animate-pulse"
              >
                {/* Section header bar */}
                <div className="bg-black/8 px-5 py-4 flex justify-between items-center">
                  <div className="h-5 w-40 bg-black/10 rounded" />
                  <div className="h-5 w-16 bg-black/10 rounded" />
                </div>
                {/* Question rows */}
                <div className="p-4 space-y-3">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-black/10 flex-shrink-0" />
                      <div className="h-4 flex-1 bg-black/6 rounded max-w-md" />
                      <div className="h-4 w-12 bg-black/6 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
