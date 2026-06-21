import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DetailSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <section className={cn("space-y-1.5", className)}>
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-muted)]">
        {title}
      </h4>      {children}
    </section>
  );
}

export function DetailStatRow({
  label,
  value,
  leading,
}: {
  label: string;
  value: string | number;
  leading?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 py-1 text-xs">
      <span className="flex min-w-0 items-center gap-2 text-[var(--color-muted)]">
        {leading}
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-mono tabular-nums text-[var(--color-foreground)]">{value}</span>
    </div>
  );
}

function parseBonusItem(item: string): { title?: string; body: string } {
  const colonIndex = item.indexOf(":");
  if (colonIndex === -1) return { body: item };

  return {
    title: item.slice(0, colonIndex).trim(),
    body: item.slice(colonIndex + 1).trim(),
  };
}

export function DetailBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const { title, body } = parseBonusItem(item);

        return (
          <li
            key={item}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)]/35 px-3 py-2"
          >
            {title ? (
              <>
                <p className="text-sm font-medium text-[var(--color-accent)]">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-foreground)]">{body}</p>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--color-foreground)]">{body}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
