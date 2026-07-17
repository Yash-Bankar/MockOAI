"use client";

import { useTransition } from "react";
import { createExamAttempt } from "@/app/actions";
import { Button } from "@/components/ui";

export function StartExamButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await createExamAttempt();
    });
  };

  return (
    <>
      {/* Full-screen loading overlay — Neo-Brutalism themed */}
      {isPending && (
        <div
          className="fixed inset-0 z-[9999] bg-paper flex items-center justify-center"
          aria-live="assertive"
          aria-busy="true"
        >
          <div className="border-[3px] border-ink rounded-[4px] shadow-brutal bg-paper p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
            {/* Stamp motif — bouncing paper emoji */}
            <div className="flex gap-1 items-end h-12">
              <span
                className="text-4xl animate-bounce"
                style={{ animationDelay: "0ms", animationDuration: "800ms" }}
              >
                📄
              </span>
              <span
                className="text-2xl animate-bounce"
                style={{ animationDelay: "150ms", animationDuration: "800ms" }}
              >
                ✏️
              </span>
              <span
                className="text-xl animate-bounce"
                style={{ animationDelay: "300ms", animationDuration: "800ms" }}
              >
                📝
              </span>
            </div>

            <div className="text-center">
              <p className="font-[family-name:var(--font-archivo-black)] text-xl text-ink uppercase tracking-tight">
                Generating your exam
              </p>
              {/* Animated dots */}
              <div className="flex justify-center gap-1.5 mt-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-ink animate-bounce inline-block"
                    style={{
                      animationDelay: `${i * 200}ms`,
                      animationDuration: "900ms",
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm text-ink/50 font-[family-name:var(--font-space-grotesk)] text-center leading-relaxed">
              Setting up your sections and questions.
              <br />
              This takes a few seconds…
            </p>
          </div>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        type="button"
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? "Generating…" : "Start New Mock OA"}
      </Button>
    </>
  );
}
