import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

function getDateWindow(tab: string): Date | null {
  const now = new Date();
  if (tab === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (tab === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  return null; // alltime / friends — no date filter
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") ?? "alltime";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const since = getDateWindow(tab);

    // Build the userId filter
    let userIdFilter: string[] | undefined;
    if (tab === "friends") {
      // People the current user follows (one-directional) + self
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      userIdFilter = [currentUserId, ...follows.map((f) => f.followingId)];
    }

    // Aggregate: best totalScore per user, only COMPLETED attempts
    const whereClause: Record<string, unknown> = {
      status: "COMPLETED",
      totalScore: { not: null },
    };
    if (since) {
      whereClause.completedAt = { gte: since };
    }
    if (userIdFilter) {
      whereClause.userId = { in: userIdFilter };
    }

    // Group by userId, take MAX(totalScore)
    const rawGroups = await prisma.examAttempt.groupBy({
      by: ["userId"],
      where: whereClause,
      _max: { totalScore: true },
      orderBy: { _max: { totalScore: "desc" } },
    });

    const total = rawGroups.length;

    // Paginate
    const pageSlice = rawGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Fetch user details for this page
    const userIds = pageSlice.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Build ranked rows — rank is global (1-indexed)
    const rows = pageSlice.map((g, i) => ({
      rank: (page - 1) * PAGE_SIZE + i + 1,
      userId: g.userId,
      name: userMap[g.userId]?.name ?? "Unknown",
      image: userMap[g.userId]?.image ?? null,
      score: g._max.totalScore ?? 0,
      isCurrentUser: g.userId === currentUserId,
    }));

    // Find current user's global rank (across all pages)
    const currentUserGlobalIdx = rawGroups.findIndex(
      (g) => g.userId === currentUserId
    );
    const currentUserRank =
      currentUserGlobalIdx >= 0 ? currentUserGlobalIdx + 1 : null;

    let currentUserRow = null;
    if (currentUserGlobalIdx >= 0) {
      const g = rawGroups[currentUserGlobalIdx];
      const u = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, name: true, image: true },
      });
      currentUserRow = {
        rank: currentUserRank,
        userId: currentUserId,
        name: u?.name ?? "You",
        image: u?.image ?? null,
        score: g._max.totalScore ?? 0,
        isCurrentUser: true,
      };
    }

    return NextResponse.json({ rows, total, currentUserRank, currentUserRow });
  } catch (error) {
    console.error("[Leaderboard GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
