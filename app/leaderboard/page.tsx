import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { LeaderboardClient } from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "Leaderboard — MockOA",
  description:
    "See how you rank against other MockOA users on the TCS NQT-Style mock OA. Filter by This Week, This Month, All Time, or Friends.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

async function fetchLeaderboardData(tab: string, userId: string) {
  const now = new Date();
  let since: Date | null = null;
  if (tab === "week") {
    since = new Date(now);
    since.setDate(since.getDate() - 7);
  } else if (tab === "month") {
    since = new Date(now);
    since.setMonth(since.getMonth() - 1);
  }

  const whereClause: Record<string, unknown> = {
    status: "COMPLETED",
    totalScore: { not: null },
  };
  if (since) whereClause.completedAt = { gte: since };

  if (tab === "friends") {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const friendIds = [userId, ...follows.map((f) => f.followingId)];
    whereClause.userId = { in: friendIds };
  }

  const rawGroups = await prisma.examAttempt.groupBy({
    by: ["userId"],
    where: whereClause,
    _max: { totalScore: true },
    orderBy: { _max: { totalScore: "desc" } },
  });

  const total = rawGroups.length;
  const pageSlice = rawGroups.slice(0, PAGE_SIZE);

  const userIds = pageSlice.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const rows = pageSlice.map((g, i) => ({
    rank: i + 1,
    userId: g.userId,
    name: userMap[g.userId]?.name ?? "Unknown",
    image: userMap[g.userId]?.image ?? null,
    score: g._max.totalScore ?? 0,
    isCurrentUser: g.userId === userId,
  }));

  const currentUserGlobalIdx = rawGroups.findIndex((g) => g.userId === userId);
  const currentUserRank = currentUserGlobalIdx >= 0 ? currentUserGlobalIdx + 1 : null;

  let currentUserRow = null;
  if (currentUserGlobalIdx >= 0) {
    const g = rawGroups[currentUserGlobalIdx];
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });
    currentUserRow = {
      rank: currentUserRank as number,
      userId,
      name: u?.name ?? "You",
      image: u?.image ?? null,
      score: g._max.totalScore ?? 0,
      isCurrentUser: true,
    };
  }

  return { rows, total, currentUserRank, currentUserRow };
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const { tab: rawTab } = await searchParams;
  const tab = ["week", "month", "alltime", "friends"].includes(rawTab ?? "")
    ? (rawTab as string)
    : "alltime";

  const initialData = await fetchLeaderboardData(tab, session.user.id);

  return (
    <main className="max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-8 pb-24">
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-archivo-black)] text-4xl text-ink leading-tight">
            Leaderboard
          </h1>
          <p className="text-sm text-ink/50 font-[family-name:var(--font-space-grotesk)] mt-1">
            Best score per user · TCS NQT-Style OA · 125 marks
          </p>
        </div>
        <div
          className="inline-flex items-center justify-center px-4 py-2 border-[3px] border-ink rounded-[4px] bg-highlighter font-[family-name:var(--font-jetbrains-mono)] font-bold text-sm text-ink shadow-brutal"
          style={{ transform: "rotate(-1.5deg)" }}
        >
          🏆 Top Scorers
        </div>
      </header>

      <hr className="border-t-[3px] border-ink" />

      {/* ─── Leaderboard client ───────────────────────────────────────── */}
      <Suspense
        fallback={
          <div className="py-20 text-center font-[family-name:var(--font-jetbrains-mono)] text-ink/40 text-sm">
            Loading leaderboard…
          </div>
        }
      >
        <LeaderboardClient
          initialData={initialData as Parameters<typeof LeaderboardClient>[0]["initialData"]}
          initialTab={tab as "week" | "month" | "alltime" | "friends"}
        />
      </Suspense>
    </main>
  );
}
