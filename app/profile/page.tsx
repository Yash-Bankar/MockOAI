import { getProfileData } from "@/app/actions";
import { Card, Badge, GradeStamp } from "@/components/ui";
import { ProfileForm } from "./ProfileForm";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user, profile, stats } = await getProfileData();

  return (
    <main className="max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-[family-name:var(--font-archivo-black)] text-3xl text-ink">
            Profile
          </h1>
          <p className="text-sm text-ink/50 font-[family-name:var(--font-space-grotesk)]">
            {user.email}
          </p>
        </div>
        <SignOutButton />
      </header>

      {/* ─── STATS SUMMARY ──────────────────────────────────────────── */}
      <section>
        <h2 className="font-[family-name:var(--font-archivo-black)] text-xl text-ink mb-4 border-b-[3px] border-ink pb-2">
          Your Stats
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-ink">
              {stats.totalAttempts}
            </div>
            <div className="text-xs text-ink/50 font-[family-name:var(--font-space-grotesk)] mt-1 uppercase tracking-wide">
              Attempts
            </div>
          </Card>
          <Card className="text-center">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-ink">
              {stats.avgScore !== null ? stats.avgScore : "—"}
              <span className="text-sm text-ink/30 ml-1">/ 125</span>
            </div>
            <div className="text-xs text-ink/50 font-[family-name:var(--font-space-grotesk)] mt-1 uppercase tracking-wide">
              Avg Score
            </div>
          </Card>
          <Card className="text-center">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-ink">
              {stats.bestScore !== null ? stats.bestScore : "—"}
              <span className="text-sm text-ink/30 ml-1">/ 125</span>
            </div>
            <div className="text-xs text-ink/50 font-[family-name:var(--font-space-grotesk)] mt-1 uppercase tracking-wide">
              Best Score
            </div>
          </Card>
        </div>
      </section>

      {/* ─── EDIT FORM ──────────────────────────────────────────────── */}
      <section>
        <h2 className="font-[family-name:var(--font-archivo-black)] text-xl text-ink mb-4 border-b-[3px] border-ink pb-2">
          Edit Profile
        </h2>
        <Card>
          <ProfileForm
            initialData={{
              college: profile.college,
              branch: profile.branch,
              graduationYear: profile.graduationYear,
              bio: profile.bio,
            }}
          />
        </Card>
      </section>
    </main>
  );
}
