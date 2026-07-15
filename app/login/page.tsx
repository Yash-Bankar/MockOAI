import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Card, GradeStamp } from "@/components/ui";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-paper">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Logo / wordmark */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-[family-name:var(--font-archivo-black)] text-4xl text-ink">
            MockOA
          </h1>
          <GradeStamp variant="rank" rotate={-2}>
            Sign In
          </GradeStamp>
        </div>

        {/* Login card */}
        <Card className="w-full text-center">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-[family-name:var(--font-archivo-black)] text-xl text-ink mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-ink/60 font-[family-name:var(--font-space-grotesk)]">
                Sign in to continue where you left off. Your attempt history,
                scores, and streaks are waiting.
              </p>
            </div>

            <div className="border-t-[3px] border-ink/10" />

            <GoogleSignInButton callbackURL="/dashboard" size="lg" />

            <p className="text-xs text-ink/40 font-[family-name:var(--font-space-grotesk)]">
              By signing in, you agree to use this platform for practice only.
              No real exam content is shared here — everything is simulated.
            </p>
          </div>
        </Card>

        {/* Back link */}
        <a
          href="/"
          className="text-sm font-semibold text-cobalt font-[family-name:var(--font-space-grotesk)] underline underline-offset-4 decoration-2 hover:decoration-cobalt focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-paper rounded-[2px]"
        >
          ← Back to home
        </a>
      </div>
    </main>
  );
}
