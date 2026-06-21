import { useMemo } from "react";
import {
  canSelectPerk,
  arePrerequisitesMet,
  getSkillLevelForPerk,
} from "@/engine/buildEngine";
import type { Perk, PerkTree } from "@/data/schemas";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBuildStore } from "@/store/buildStore";

interface PerkNodeProps {
  perk: Perk;
  tree: PerkTree;
  isSelected: boolean;
  isAvailable: boolean;
  isLocked: boolean;
  onToggle: () => void;
  labels: Record<string, string>;
}

function PerkNode({
  perk,
  isSelected,
  isAvailable,
  isLocked,
  onToggle,
  labels,
}: PerkNodeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          disabled={isLocked && !isSelected}
          className={cn(
            "absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-all",
            isSelected &&
              "border-[var(--color-perk-selected)] bg-[var(--color-perk-selected)]/25 text-[var(--color-perk-selected)] shadow-[var(--shadow-glow)]",
            !isSelected &&
              isAvailable &&
              "border-[var(--color-perk-available)] bg-[var(--color-surface-elevated)] text-[var(--color-foreground)] hover:border-[var(--color-accent)]",
            !isSelected &&
              !isAvailable &&
              !isLocked &&
              "border-[var(--color-perk-prereq)] bg-[var(--color-surface)] text-[var(--color-muted)]",
            isLocked &&
              !isSelected &&
              "cursor-not-allowed border-[var(--color-perk-locked)] bg-[var(--color-surface)] text-[var(--color-muted)] opacity-60",
          )}
          style={{ left: `${perk.position.x}%`, top: `${perk.position.y}%` }}
        >
          {perk.name.slice(0, 2).toUpperCase()}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <p className="font-semibold text-[var(--color-accent)]">{perk.name}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {labels.skillReq}: {perk.skillReq}
        </p>
        <p className="mt-2 text-xs">{perk.description}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {isSelected
            ? labels.selected
            : isLocked
              ? labels.locked
              : isAvailable
                ? labels.available
                : labels.locked}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

interface PerkTreeViewProps {
  tree: PerkTree;
  labels: Record<string, string>;
}

function PerkTreeView({ tree, labels }: PerkTreeViewProps) {
  const gameData = useBuildStore((s) => s.gameData);
  const build = useBuildStore((s) => s.build);
  const togglePerk = useBuildStore((s) => s.togglePerk);

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
          active: build.selectedPerkIds.includes(prereqId) && build.selectedPerkIds.includes(perk.id),
        });
      }
    }
    return lines;
  }, [tree, build.selectedPerkIds]);

  if (!gameData) return null;

  return (
    <div className="relative h-full min-h-[280px] w-full min-w-[500px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]/50">
      <svg className="absolute inset-0 h-full w-full">
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={`${edge.x1}%`}
            y1={`${edge.y1}%`}
            x2={`${edge.x2}%`}
            y2={`${edge.y2}%`}
            stroke={edge.active ? "var(--color-accent)" : "var(--color-border)"}
            strokeWidth={edge.active ? 2 : 1}
            strokeOpacity={edge.active ? 0.8 : 0.4}
          />
        ))}
      </svg>
      {tree.perks.map((perk) => {
        const isSelected = build.selectedPerkIds.includes(perk.id);
        const prereqsMet = arePrerequisitesMet(gameData.game, build, perk);
        const skillLevel = getSkillLevelForPerk(gameData.game, build, perk);
        const meetsSkillReq = skillLevel >= perk.skillReq;
        const isAvailable = canSelectPerk(gameData.game, build, perk.id) && !isSelected;
        const isLocked = !isSelected && (!prereqsMet || !meetsSkillReq);

        return (
          <PerkNode
            key={perk.id}
            perk={perk}
            tree={tree}
            isSelected={isSelected}
            isAvailable={isAvailable}
            isLocked={isLocked}
            onToggle={() => togglePerk(perk.id)}
            labels={labels}
          />
        );
      })}
    </div>
  );
}

export { PerkTreeView };
