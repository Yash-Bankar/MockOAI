import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData, createExamAttempt } from "@/app/actions";
import { Button, Card, Badge, GradeStamp } from "@/components/ui";
import { AttemptStatus } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

const statusStyles: Record<AttemptStatus, { badge: "success" | "danger" | "warning"; label: string }> = {
  COMPLETED: { badge: "success", label: "Completed" },
  IN_PROGRESS: { badge: "warning", label: "In Progress" },
  ABANDONED: { badge: "danger", label: "Abandoned" },
};

export default async function DashboardPage() {
  const { user, profile, attempts, patternId, stats } =
    await getDashboardData();

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-[family-name:var(--font-archivo-black)] text-3xl text-ink">
            Hey, {firstName}
          </h1>
          <p className="text-sm text-ink/50 font-[family-name:var(--font-space-grotesk)]">
            {stats.totalAttempts === 0
              ? "You haven't taken a mock yet. Let's fix that."
              : `You've taken ${stats.totalAttempts} mock${stats.totalAttempts === 1 ? "" : "s"} so far.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GradeStamp variant="rank" rotate={-2}>
            🔥 {stats.currentStreak}d streak
          </GradeStamp>
          <Link href="/leaderboard">
            <Button variant="secondary" size="sm">Leaderboard</Button>
          </Link>
          <Link href="/profile">
            <Button variant="secondary" size="sm">Profile</Button>
          </Link>
        </div>
      </header>

      {/* ─── QUICK STATS ────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Attempts" value={stats.totalAttempts} />
        <StatCard
          label="Avg Score"
          value={stats.avgScore !== null ? `${stats.avgScore}` : "—"}
          suffix={stats.avgScore !== null ? "/ 125" : ""}
        />
        <StatCard
          label="Best Score"
          value={stats.bestScore !== null ? `${stats.bestScore}` : "—"}
          suffix={stats.bestScore !== null ? "/ 125" : ""}
        />
        <StatCard label="Current Streak" value={`${stats.currentStreak}d`} />
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section>
        <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-archivo-black)] text-xl text-ink mb-1">
              Ready for another round?
            </h2>
            <p className="text-sm text-ink/60 font-[family-name:var(--font-space-grotesk)]">
              TCS NQT-Style OA — 125 marks, 5 sections, 2 hours. Same pattern
              every time so you can track real improvement.
            </p>
          </div>
          <form action={createExamAttempt}>
            <Button variant="primary" size="lg" type="submit">
              Start New Mock OA
            </Button>
          </form>
        </Card>
      </section>

      {/* ─── RECENT ATTEMPTS ────────────────────────────────────────── */}
      <section>
        <h2 className="font-[family-name:var(--font-archivo-black)] text-2xl text-ink mb-5 border-b-[3px] border-ink pb-2">
          Recent Attempts
        </h2>

        {attempts.length === 0 ? (
          <Card className="text-center py-10">
            <div className="flex flex-col items-center gap-4">
              <GradeStamp variant="neutral" rotate={3}>
                No Attempts
              </GradeStamp>
              <p className="text-ink/60 font-[family-name:var(--font-space-grotesk)] max-w-sm">
                You haven't started a mock OA yet. Hit the button above — it
                takes 2 hours and you'll know exactly where you stand.
              </p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {attempts.map((attempt) => {
              const st = statusStyles[attempt.status];
              const date = new Date(attempt.createdAt).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short", year: "numeric" }
              );
              const scoreDisplay =
                attempt.totalScore !== null
                  ? `${attempt.totalScore} / ${attempt.maxScore}`
                  : `— / ${attempt.maxScore}`;

              return (
                <Card
                  key={attempt.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-ink truncate">
                        {attempt.pattern.name}
                      </span>
                      <Badge variant={st.badge}>{st.label}</Badge>
                    </div>
                    <span className="text-xs text-ink/40 font-[family-name:var(--font-jetbrains-mono)]">
                      {date}
                    </span>
                  </div>

                  <div className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold text-ink">
                    {scoreDisplay}
                  </div>

                  {attempt.status === "IN_PROGRESS" && (
                    <Link href={`/exam/${attempt.id}`}>
                      <Button variant="secondary" size="sm">
                        Resume
                      </Button>
                    </Link>
                  )}

                  {attempt.status === "COMPLETED" && (
                    <Link href={`/exam/${attempt.id}/results`}>
                      <Button variant="secondary" size="sm">
                        View Results
                      </Button>
                    </Link>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <Card className="text-center">
      <div className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-ink">
        {value}
        {suffix && (
          <span className="text-sm text-ink/30 ml-1">{suffix}</span>
        )}
      </div>
      <div className="text-xs text-ink/50 font-[family-name:var(--font-space-grotesk)] mt-1 uppercase tracking-wide">
        {label}
      </div>
    </Card>
  );
}
