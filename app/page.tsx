import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button, Card, Badge, GradeStamp } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import HeroSimulator from "@/app/components/HeroSimulator";

const SECTIONS = [
  { name: "English", score: 16, max: 20, color: "bg-cobalt" },
  { name: "Reasoning", score: 14, max: 20, color: "bg-cobalt" },
  { name: "Quant", score: 11, max: 20, color: "bg-highlighter" },
  { name: "CS Fundamentals", score: 17, max: 20, color: "bg-pass-green" },
  { name: "Coding", score: 32, max: 45, color: "bg-pass-green" },
];
interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  streak: number;
}

const LEADERBOARD: LeaderboardEntry[] = [];

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 7);

  // Group by userId, take max score
  const rawGroups = await prisma.examAttempt.groupBy({
    by: ["userId"],
    where: {
      status: "COMPLETED",
      totalScore: { not: null },
      completedAt: { gte: since },
    },
    _max: { totalScore: true },
    orderBy: { _max: { totalScore: "desc" } },
    take: 5,
  });

  let leaderboardData: LeaderboardEntry[] = [];
  if (rawGroups.length > 0) {
    const userIds = rawGroups.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            currentStreak: true,
          },
        },
      },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    leaderboardData = rawGroups.map((g, index) => ({
      rank: index + 1,
      name: userMap[g.userId]?.name ?? "Unknown",
      score: g._max.totalScore ?? 0,
      streak: userMap[g.userId]?.profile?.currentStreak ?? 0,
    }));
  }

  // Fallback to all-time leaderboard if weekly is empty or small
  if (leaderboardData.length < 5) {
    const alltimeGroups = await prisma.examAttempt.groupBy({
      by: ["userId"],
      where: {
        status: "COMPLETED",
        totalScore: { not: null },
      },
      _max: { totalScore: true },
      orderBy: { _max: { totalScore: "desc" } },
      take: 5,
    });
    if (alltimeGroups.length > 0) {
      const userIds = alltimeGroups.map((g) => g.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              currentStreak: true,
            },
          },
        },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      leaderboardData = alltimeGroups.map((g, index) => ({
        rank: index + 1,
        name: userMap[g.userId]?.name ?? "Unknown",
        score: g._max.totalScore ?? 0,
        streak: userMap[g.userId]?.profile?.currentStreak ?? 0,
      }));
    }
  }

  // Merge with static data if still less than 5
  if (leaderboardData.length < 5) {
    const staticData = LEADERBOARD.slice(leaderboardData.length);
    leaderboardData = [...leaderboardData, ...staticData].map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }

  return (
    <main className="flex flex-col">
      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — copy */}
        <div className="flex flex-col gap-6">
          <Badge variant="warning">Practice. Don&apos;t guess.</Badge>

          <h1 className="font-[family-name:var(--font-archivo-black)] text-4xl sm:text-5xl text-ink leading-[1.1]">
            Stop grinding random DSA.
            <br />
            <span className="text-cobalt">Start practicing the actual OA format.</span>
          </h1>

          <p className="text-lg text-ink/70 font-[family-name:var(--font-space-grotesk)] max-w-lg">
            TCS NQT, Infosys, Wipro — they don&apos;t just ask LeetCode. You get
            English, Reasoning, Quant, CS Fundamentals, and Coding, all in one
            timed session. MockOA simulates that exact pattern so there are no
            surprises on test day.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link href={session ? "/dashboard" : "/login"}>
              <Button variant="primary" size="lg">
                {session ? "Go to Dashboard" : "Start a Mock OA"}
              </Button>
            </Link>
            <a href="#pattern">
              <Button variant="secondary" size="lg">
                See the Pattern
              </Button>
            </a>
          </div>

          <p className="text-xs text-ink/40 font-[family-name:var(--font-jetbrains-mono)]">
            Free. No credit card. Just your Google account.
          </p>
        </div>

        {/* Right — simulated breakdown card with motion */}
        <div className="flex justify-center lg:justify-end">
          <HeroSimulator />
        </div>
      </section>

      {/* ─── WHAT THIS IS ───────────────────────────────────────────── */}
      <section className="bg-ink py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-highlighter text-2xl font-bold">
              5 sections.
            </div>
            <p className="text-paper/70 font-[family-name:var(--font-space-grotesk)]">
              Not just coding. The real OA has English, Reasoning, Quant, CS
              Fundamentals, and Coding — each timed, each scored separately.
              You need to be good at all five, not just one.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-highlighter text-2xl font-bold">
              Real Piston execution.
            </div>
            <p className="text-paper/70 font-[family-name:var(--font-space-grotesk)]">
              Your code runs in an isolated sandbox — C, C++, Python, Java,
              whatever the real OA supports. Same timeouts, same constraints.
              No cheating with local IDE shortcuts.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-highlighter text-2xl font-bold">
              AI feedback after.
            </div>
            <p className="text-paper/70 font-[family-name:var(--font-space-grotesk)]">
              You don&apos;t just get a score. You get a breakdown of what went
              wrong, which topics to revise, and where you&apos;re losing the
              most marks. Like a study partner who actually took the test.
            </p>
          </div>
        </div>
      </section>

      {/* ─── THE PATTERN ────────────────────────────────────────────── */}
      <section id="pattern" className="max-w-6xl mx-auto w-full px-6 py-20">
        <div className="flex flex-col gap-3 mb-10">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="font-[family-name:var(--font-archivo-black)] text-3xl text-ink">
              The Pattern
            </h2>
            <GradeStamp variant="info" rotate={-3}>
              Verified Pattern
            </GradeStamp>
          </div>
          <p className="text-ink/60 font-[family-name:var(--font-space-grotesk)] max-w-xl">
            Modeled on the TCS NQT-Style OA — 125 marks, 5 sections, 83
            questions. Every mock you take follows this exact breakdown.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              name: "English",
              questions: 20,
              marks: 20,
              passing: 10,
              format: "MCQ",
              tilt: -1,
            },
            {
              name: "Reasoning",
              questions: 20,
              marks: 20,
              passing: 10,
              format: "MCQ",
              tilt: 2,
            },
            {
              name: "Quant",
              questions: 20,
              marks: 20,
              passing: 10,
              format: "MCQ",
              tilt: -2,
            },
            {
              name: "CS Fundamentals",
              questions: 20,
              marks: 20,
              passing: 10,
              format: "MCQ",
              tilt: 1,
            },
            {
              name: "Coding",
              questions: 3,
              marks: 45,
              passing: 22.5,
              format: "Coding",
              tilt: -1.5,
            },
          ].map((section) => (
            <Card key={section.name} tilt={section.tilt} className="text-center flex flex-col justify-between h-full">
              <div>
                <h3 className="font-[family-name:var(--font-archivo-black)] text-base text-ink mb-3">
                  {section.name}
                </h3>
                <div className="font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold text-ink mb-1">
                  {section.marks}
                </div>
                <div className="text-[11px] text-ink/50 font-[family-name:var(--font-space-grotesk)] mb-1">
                  marks
                </div>
                <div className="text-[11px] text-pass-green font-bold font-[family-name:var(--font-jetbrains-mono)] mb-3">
                  Passing: {section.passing}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-ink/10">
                <Badge variant={section.format === "Coding" ? "info" : "default"}>
                  {section.format}
                </Badge>
                <span className="text-xs text-ink/40 font-[family-name:var(--font-jetbrains-mono)]">
                  {section.questions} Qs
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── LEADERBOARD PREVIEW ────────────────────────────────────── */}
      <section className="bg-paper-alt py-16 px-6 border-y-[3px] border-ink">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <h2 className="font-[family-name:var(--font-archivo-black)] text-3xl text-ink">
              This Week&apos;s Leaderboard
            </h2>
            <Badge variant="danger">Live</Badge>
          </div>

          <Card noPadding>
            <div className="divide-y-[2px] divide-ink/10">
              {leaderboardData.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold text-ink w-8 text-center">
                    {entry.rank}
                  </span>
                  <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-ink flex-1">
                    {entry.name}
                  </span>
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm font-bold text-ink">
                    {entry.score}/125
                  </span>
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-ink/40">
                    🔥 {entry.streak}d
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-6 text-center">
            <Link href={session ? "/leaderboard" : "/login"}>
              <Button variant="primary" size="md">
                {session ? "View Full Leaderboard" : "Join the Leaderboard"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto w-full px-6 py-20 text-center">
        <h2 className="font-[family-name:var(--font-archivo-black)] text-3xl text-ink mb-4">
          You&apos;ve seen the pattern. Now practice it.
        </h2>
        <p className="text-ink/60 font-[family-name:var(--font-space-grotesk)] mb-8 max-w-lg mx-auto">
          One mock takes about 2 hours. That&apos;s less time than you&apos;d spend
          picking which DSA sheet to follow. And this one actually maps to
          the test you&apos;re preparing for.
        </p>
        <Link href={session ? "/dashboard" : "/login"}>
          <Button variant="primary" size="lg">
            {session ? "Start Your Next Mock" : "Start Your First Mock — Free"}
          </Button>
        </Link>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-ink py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-[family-name:var(--font-archivo-black)] text-paper text-lg">
            MockOAI
          </span>
          <span className="text-paper/40 text-xs font-[family-name:var(--font-space-grotesk)]">
            "Hell naah" - Yash Bankar
          </span>
        </div>
      </footer>
    </main>
  );
}
