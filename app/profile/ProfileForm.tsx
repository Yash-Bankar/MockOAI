"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "@/app/actions";
import { Button, Input } from "@/components/ui";

interface ProfileFormProps {
  initialData: {
    college: string | null;
    branch: string | null;
    graduationYear: number | null;
    bio: string | null;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      await saveProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="College"
        name="college"
        placeholder="e.g. VIT Vellore"
        defaultValue={initialData.college ?? ""}
      />
      <Input
        label="Branch"
        name="branch"
        placeholder="e.g. Computer Science"
        defaultValue={initialData.branch ?? ""}
      />
      <Input
        label="Graduation Year"
        name="graduationYear"
        type="number"
        placeholder="e.g. 2026"
        defaultValue={initialData.graduationYear?.toString() ?? ""}
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="bio"
          className="text-sm font-semibold font-[family-name:var(--font-space-grotesk)] text-ink"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          placeholder="Prepping for TCS NQT. Weak in Quant, strong in Coding."
          defaultValue={initialData.bio ?? ""}
          className={[
            "w-full px-3 py-2",
            "bg-paper text-ink placeholder:text-ink/40",
            "border-[3px] border-ink rounded-[4px]",
            "shadow-brutal",
            "font-[family-name:var(--font-space-grotesk)]",
            "outline-none resize-none",
            "focus:shadow-[8px_8px_0_var(--ink)]",
            "transition-shadow 60ms ease",
          ].join(" ")}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save Profile"}
        </Button>
        {saved && (
          <span className="text-sm font-[family-name:var(--font-jetbrains-mono)] text-pass-green font-semibold">
            Saved ✓
          </span>
        )}
      </div>
    </form>
  );
}
