import { useMemo } from "react";
import type { PerkTree } from "@/data/schemas";
import { cn } from "@/lib/utils";
import { useBuildStore } from "@/store/buildStore";

interface PerkTreeMiniViewProps {
  tree: PerkTree;
  className?: string;
}

export function PerkTreeMiniView({ tree, className }: PerkTreeMiniViewProps) {
  const selectedPerkIds = useBuildStore((s) => s.build.selectedPerkIds);

  const edges = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
    for (const perk of tree.perks) {
      for (const prereqId of perk.prerequisites) {
        const prereq = tree.perks.find((p) => p.id === prereqId);
        if (!prereq) continue;
        lines.push({
          x1: prereq.position.x,
          y1: prereq.position.y,
          x2: perk.position.x,
          y2: perk.position.y,
          active: selectedPerkIds.includes(prereqId) && selectedPerkIds.includes(perk.id),
        });
      }
    }
    return lines;
  }, [tree, selectedPerkIds]);

  return (
    <div
      className={cn(
        "relative aspect-[5/3] w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)]/60 bg-[var(--color-background)]/40",
        className,
      )}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={edge.active ? "var(--color-accent)" : "var(--color-border)"}
            strokeWidth={edge.active ? 1.5 : 0.75}
            strokeOpacity={edge.active ? 0.85 : 0.35}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {tree.perks.map((perk) => {
          const isSelected = selectedPerkIds.includes(perk.id);
          return (
            <circle
              key={perk.id}
              cx={perk.position.x}
              cy={perk.position.y}
              r={isSelected ? 3.25 : 2.5}
              fill={isSelected ? "var(--color-perk-selected)" : "var(--color-surface-elevated)"}
              stroke={isSelected ? "var(--color-perk-selected)" : "var(--color-border)"}
              strokeWidth={0.75}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
}
