"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/60" />

      {/* Dialog */}
      <div
        className={[
          "relative z-10 w-full max-w-md mx-4",
          "bg-paper border-[3px] border-ink rounded-[4px]",
          "shadow-[8px_8px_0_var(--ink)]",
          "p-6",
        ].join(" ")}
      >
        {title && (
          <h2 className="text-xl font-bold font-[family-name:var(--font-archivo-black)] text-ink mb-4">
            {title}
          </h2>
        )}

        <div className="text-ink font-[family-name:var(--font-space-grotesk)] mb-6">
          {children}
        </div>

        {actions && (
          <div className="flex items-center justify-end gap-3">{actions}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

Modal.displayName = "Modal";

export { Modal };
export type { ModalProps };
