"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AttemptStatus } from "@/app/generated/prisma/client";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user;
}

export async function createExamAttempt() {
  const user = await requireUser();

  const pattern = await prisma.examPattern.findFirst({
    where: { name: "TCS NQT-Style OA", isActive: true },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!pattern) {
    throw new Error("No active exam pattern found. Run the seed first.");
  }

  const totalDuration = 7200;

  const attempt = await prisma.examAttempt.create({
    data: {
      userId: user.id,
      patternId: pattern.id,
      maxScore: pattern.maxScore,
      durationSeconds: totalDuration,
      sections: {
        create: pattern.sections.map((sc) => ({
          sectionConfigId: sc.id,
          name: sc.name,
          order: sc.order,
          maxScore: sc.maxScore,
        })),
      },
    },
  });

  redirect(`/exam/${attempt.id}`);
}

export async function getDashboardData() {
  const user = await requireUser();

  const [profile, attempts, pattern] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.examAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { pattern: { select: { name: true } } },
    }),
    prisma.examPattern.findFirst({
      where: { name: "TCS NQT-Style OA", isActive: true },
      select: { id: true },
    }),
  ]);

  const allAttempts = await prisma.examAttempt.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    select: { totalScore: true },
  });

  const completedScores = allAttempts
    .map((a) => a.totalScore)
    .filter((s): s is number => s !== null);

  const totalAttempts = await prisma.examAttempt.count({
    where: { userId: user.id },
  });

  const avgScore =
    completedScores.length > 0
      ? Math.round(
          (completedScores.reduce((a, b) => a + b, 0) /
            completedScores.length) *
            10
        ) / 10
      : null;

  const bestScore =
    completedScores.length > 0 ? Math.max(...completedScores) : null;

  return {
    user,
    profile,
    attempts,
    patternId: pattern?.id ?? null,
    stats: {
      totalAttempts,
      avgScore,
      bestScore,
      currentStreak: profile?.currentStreak ?? 0,
    },
  };
}

export async function saveProfile(formData: FormData) {
  const user = await requireUser();

  const college = formData.get("college") as string;
  const branch = formData.get("branch") as string;
  const graduationYearRaw = formData.get("graduationYear") as string;
  const bio = formData.get("bio") as string;

  const graduationYear = graduationYearRaw
    ? parseInt(graduationYearRaw, 10)
    : null;

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      college: college || null,
      branch: branch || null,
      graduationYear,
      bio: bio || null,
    },
    update: {
      college: college || null,
      branch: branch || null,
      graduationYear,
      bio: bio || null,
    },
  });

  return { success: true };
}

export async function getProfileData() {
  const user = await requireUser();

  const [profile, attemptStats] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.examAttempt.aggregate({
      where: { userId: user.id, status: "COMPLETED" },
      _count: true,
      _avg: { totalScore: true },
      _max: { totalScore: true },
    }),
  ]);

  if (!profile) {
    const created = await prisma.userProfile.create({
      data: { userId: user.id },
    });
    return {
      user,
      profile: created,
      stats: {
        totalAttempts: 0,
        avgScore: null,
        bestScore: null,
      },
    };
  }

  return {
    user,
    profile,
    stats: {
      totalAttempts: attemptStats._count,
      avgScore: attemptStats._avg.totalScore
        ? Math.round(attemptStats._avg.totalScore * 10) / 10
        : null,
      bestScore: attemptStats._max.totalScore,
    },
  };
}
