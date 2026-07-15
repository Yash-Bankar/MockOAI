import { HTMLAttributes, forwardRef } from "react";

/* ──────────────────────────────────────────────────────────────────────────────
   Badge — inline status pill, brutalist style
   ────────────────────────────────────────────────────────────────────────────── */

type BadgeVariant = "default" | "success" | "danger" | "info" | "warning";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-paper-alt text-ink",
  success: "bg-pass-green text-white",
  danger: "bg-red-pen text-white",
  info: "bg-cobalt text-white",
  warning: "bg-highlighter text-ink",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={[
          "inline-flex items-center",
          "px-2.5 py-0.5",
          "text-xs font-bold uppercase tracking-wide",
          "font-[family-name:var(--font-jetbrains-mono)]",
          "border-[2px] border-ink rounded-[3px]",
          badgeVariants[variant],
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

/* ──────────────────────────────────────────────────────────────────────────────
   GradeStamp — rotated, thick-bordered badge for ranks, pass/fail, status.
   The signature neo-brutalist component.
   ────────────────────────────────────────────────────────────────────────────── */

type GradeStampVariant = "pass" | "fail" | "rank" | "info" | "neutral";

interface GradeStampProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GradeStampVariant;
  rotate?: number;
}

const gradeStampVariants: Record<GradeStampVariant, string> = {
  pass: "bg-pass-green text-white border-ink",
  fail: "bg-red-pen text-white border-ink",
  rank: "bg-highlighter text-ink border-ink",
  info: "bg-cobalt text-white border-ink",
  neutral: "bg-paper-alt text-ink border-ink",
};

const GradeStamp = forwardRef<HTMLDivElement, GradeStampProps>(
  (
    { variant = "neutral", rotate = 0, className = "", children, style, ...props },
    ref
  ) => {
    const rotation =
      rotate === 0
        ? Math.floor(Math.random() * 11) - 6
        : rotate;

    return (
      <div
        ref={ref}
        className={[
          "inline-flex items-center justify-center",
          "px-4 py-1.5",
          "text-sm font-bold uppercase tracking-wider",
          "font-[family-name:var(--font-jetbrains-mono)]",
          "border-[3px] rounded-[4px]",
          gradeStampVariants[variant],
          className,
        ].join(" ")}
        style={{
          transform: `rotate(${rotation}deg)`,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GradeStamp.displayName = "GradeStamp";

export { Badge, GradeStamp };
export type { BadgeProps, BadgeVariant, GradeStampProps, GradeStampVariant };
