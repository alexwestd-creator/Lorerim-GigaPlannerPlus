import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "selected" | "muted";
  className?: string;
  onClick?: () => void;
}

export function Badge({ children, variant = "default", className, onClick }: BadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variant === "default" &&
          "border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-foreground)] hover:border-[var(--color-accent-muted)]",
        variant === "selected" &&
          "border border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
        variant === "muted" && "bg-[var(--color-surface-elevated)] text-[var(--color-muted)]",
        onClick && "cursor-pointer",
        !onClick && "cursor-default",
        className,
      )}
    >
      {children}
    </button>
  );
}
