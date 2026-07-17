import { Clock } from 'lucide-react';

interface ResultsHeaderProps {
  score: number;
  maxScore: number;
  timeSpentSeconds: number;
}

export function ResultsHeader({ score, maxScore, timeSpentSeconds }: ResultsHeaderProps) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;

  // Scoring Thresholds
  const isGreat = pct >= 80;
  const isGood = pct >= 50 && pct < 80;
  const isCritical = pct < 50;

  const m = Math.floor(timeSpentSeconds / 60);
  const s = timeSpentSeconds % 60;
  const timeString = `${m}m ${s}s`;

  let gradeColor = 'bg-[#00E676]';
  let gradeText = 'Pass';
  if (isGood) {
    gradeColor = 'bg-[#FFB800]';
    gradeText = 'Review';
  } else if (isCritical) {
    gradeColor = 'bg-[#FF4081]';
    gradeText = 'Fail';
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 mb-12">
      {/* GradeStamp */}
      <div className={`p-8 border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center transform -rotate-2 ${gradeColor}`}>
        <div className="text-sm font-bold uppercase tracking-widest border-b-2 border-black mb-2 px-2">Final Score</div>
        <div className="text-6xl font-black tracking-tighter">
          {score} <span className="text-3xl">/ {maxScore}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
          <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Status</div>
          <div className={`text-4xl font-black ${isCritical ? 'text-[#FF4081]' : 'text-black'}`}>
            {gradeText.toUpperCase()}
          </div>
        </div>

        <div className="bg-[#2979FF] text-white border-4 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
          <div className="text-sm font-bold uppercase tracking-widest text-white/80 mb-1 flex items-center gap-2">
            <Clock size={16} /> Total Time
          </div>
          <div className="text-4xl font-black">
            {timeString}
          </div>
        </div>
      </div>
    </div>
  );
}
