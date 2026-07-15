import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AttemptStatus } from "@/app/generated/prisma/client";
import { ExamClient } from "./ExamClient";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      pattern: {
        include: {
          sections: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    notFound();
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    redirect("/dashboard");
  }

  // Map sections for the client
  const sections = attempt.pattern.sections.map((sec) => ({
    id: sec.id,
    name: sec.name,
    order: sec.order,
  }));

  return (
    <div className="theme-exam h-full w-full fixed inset-0 z-50 bg-[var(--exam-bg)] text-[var(--exam-text)] overflow-hidden font-sans">
      <ExamClient 
        attemptId={attempt.id}
        patternName={attempt.pattern.name}
        durationSeconds={attempt.durationSeconds}
        sections={sections}
        startedAt={attempt.startedAt.toISOString()}
      />
    </div>
  );
}
