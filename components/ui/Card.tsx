import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tilt?: number;
  noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ tilt, noPadding = false, className = "", children, style, ...props }, ref) => {
    const tiltStyle = tilt
      ? { transform: `rotate(${tilt}deg)`, ...style }
      : style;

    return (
      <div
        ref={ref}
        className={[
          "bg-paper border-[3px] border-ink rounded-[4px]",
          "shadow-brutal",
          noPadding ? "" : "p-5",
          tilt ? "" : "",
          className,
        ].join(" ")}
        style={tiltStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
export type { CardProps };
