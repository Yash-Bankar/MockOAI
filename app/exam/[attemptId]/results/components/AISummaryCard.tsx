export function AISummaryCard({ summary }: { summary: string | null }) {
  if (!summary) return null;

  return (
    <div className="mb-12 relative">
      {/* Tape decoration */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/50 border-2 border-black/20 transform -rotate-2 z-10"></div>
      
      <div className="bg-[#FEF08A] border-4 border-black p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] transform rotate-1 hover:rotate-0 transition-transform">
        <h3 className="font-bold text-xl mb-4 border-b-2 border-black/20 pb-2 flex items-center gap-2">
          <span className="text-2xl">📝</span> Grader's Notes
        </h3>
        <div className="prose prose-lg max-w-none prose-p:leading-relaxed text-black/80 font-medium">
          {summary.split('\n').map((line, i) => (
            <p key={i} className="mb-2 last:mb-0">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
