import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AttemptStatus } from "@/app/generated/prisma/client";
import { ResultsHeader } from "./components/ResultsHeader";
import { Charts } from "./components/Charts";
import { QuestionReview } from "./components/QuestionReview";
import Link from "next/link";

export default async function ResultsPage(props: { params: Promise<{ attemptId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  const { attemptId } = await props.params;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      pattern: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: {
              submission: true,
            },
          },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    redirect("/dashboard");
  }

  if (attempt.status !== AttemptStatus.COMPLETED) {
    redirect(`/exam/${attemptId}`);
  }

  // Calculate total time spent (sum of section times or use actual elapsed time, fallback to duration)
  let totalTimeSpent = attempt.sections.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);
  if (totalTimeSpent === 0 && attempt.completedAt) {
    totalTimeSpent = Math.floor((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000);
  }
  if (totalTimeSpent === 0) totalTimeSpent = attempt.durationSeconds;

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-black p-4 md:p-8 font-sans selection:bg-[#00E676] selection:text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            Exam Results
            <span className="block text-lg font-bold tracking-widest text-gray-500 mt-1">{attempt.pattern.name}</span>
          </h1>
          <div className="flex gap-4">
            <Link 
              href="/dashboard"
              className="px-6 py-3 border-4 border-black bg-white font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <ResultsHeader 
          score={attempt.totalScore ?? 0} 
          maxScore={attempt.maxScore} 
          timeSpentSeconds={totalTimeSpent}
        />

        <Charts sections={attempt.sections} />


        <QuestionReview sections={attempt.sections} />

        <div className="mt-12 flex justify-center">
          <Link 
            href="/dashboard"
            className="px-8 py-4 border-4 border-black bg-[#FFB800] font-black text-xl uppercase tracking-widest shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-y-[4px] hover:translate-x-[4px] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
          >
            Start Another Mock OA
          </Link>
        </div>
      </div>
    </div>
  );
}
