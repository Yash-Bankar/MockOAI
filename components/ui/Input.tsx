import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold font-[family-name:var(--font-space-grotesk)] text-ink"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full px-3 py-2",
            "bg-paper text-ink placeholder:text-ink/40",
            "border-[3px] border-ink rounded-[4px]",
            "shadow-brutal",
            "font-[family-name:var(--font-space-grotesk)]",
            "outline-none",
            "focus:shadow-[8px_8px_0_var(--ink)]",
            "transition-shadow 60ms ease",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-red-pen" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <span className="text-xs font-[family-name:var(--font-jetbrains-mono)] text-red-pen font-semibold">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
