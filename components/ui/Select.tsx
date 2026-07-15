import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold font-[family-name:var(--font-space-grotesk)] text-ink"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            "w-full px-3 py-2",
            "bg-paper text-ink",
            "border-[3px] border-ink rounded-[4px]",
            "shadow-brutal",
            "font-[family-name:var(--font-space-grotesk)]",
            "outline-none cursor-pointer",
            "focus:shadow-[8px_8px_0_var(--ink)]",
            "transition-shadow 60ms ease",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-red-pen" : "",
            className,
          ].join(" ")}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-xs font-[family-name:var(--font-jetbrains-mono)] text-red-pen font-semibold">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export type { SelectProps };
