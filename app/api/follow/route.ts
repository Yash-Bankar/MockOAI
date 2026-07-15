import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;
    const { followingId } = await request.json();

    if (!followingId || followingId === currentUserId) {
      return NextResponse.json({ error: "Invalid followingId" }, { status: 400 });
    }

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: currentUserId, followingId } },
      create: { followerId: currentUserId, followingId },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Follow POST]", error);
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;
    const { followingId } = await request.json();

    if (!followingId) {
      return NextResponse.json({ error: "Invalid followingId" }, { status: 400 });
    }

    await prisma.follow.deleteMany({
      where: { followerId: currentUserId, followingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Follow DELETE]", error);
    return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 });
  }
}
