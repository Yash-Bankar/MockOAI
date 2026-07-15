import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-highlighter text-ink border-ink shadow-brutal",
  secondary:
    "bg-paper text-ink border-ink shadow-brutal",
  danger:
    "bg-red-pen text-white border-ink shadow-brutal",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3 text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center gap-2",
          "font-[family-name:var(--font-space-grotesk)] font-semibold",
          "border-[3px] rounded-[4px]",
          "cursor-pointer select-none",
          "stamp-press",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:stamp-press-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(" ")}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonVariant, ButtonSize, ButtonProps };
