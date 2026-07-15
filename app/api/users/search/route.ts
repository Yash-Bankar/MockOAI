import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";

    if (q.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        id: { not: currentUserId }, // exclude self
      },
      select: { id: true, name: true, image: true },
      take: 10,
    });

    // Check which ones the current user already follows
    const followingIds = (
      await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: users.map((u) => u.id) },
        },
        select: { followingId: true },
      })
    ).map((f) => f.followingId);

    const followingSet = new Set(followingIds);

    const result = users.map((u) => ({
      ...u,
      isFollowing: followingSet.has(u.id),
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("[Users Search GET]", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
