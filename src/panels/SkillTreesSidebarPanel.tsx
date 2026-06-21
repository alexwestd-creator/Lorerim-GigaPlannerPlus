import { PerkTreeMiniView } from "@/components/PerkTreeMiniView";
import { SkillIcon } from "@/components/SkillIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useBuildStore } from "@/store/buildStore";
import { useUiStore } from "@/store/uiStore";
import { usePanelLabels } from "@/theme/ThemeProvider";

export function SkillTreesSidebarPanel() {
  const labels = usePanelLabels("skill-trees");
  const gameData = useBuildStore((s) => s.gameData);
  const build = useBuildStore((s) => s.build);
  const resetAllPerks = useBuildStore((s) => s.resetAllPerks);
  const activeSkillTreeId = useUiStore((s) => s.activeSkillTreeId);
  const setActiveSkillTreeId = useUiStore((s) => s.setActiveSkillTreeId);
  const setMiddleView = useUiStore((s) => s.setMiddleView);

  if (!gameData) return null;

  const trees = Object.values(gameData.game.perkTrees);

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 flex-row items-center justify-between space-y-0 border-b border-[var(--color-border)]/50 pb-3">
        <CardTitle className="text-base">{labels.title}</CardTitle>
        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={resetAllPerks}>
          {labels.resetAll}
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-2 p-3">
            {trees.map((tree) => {
              const selectedCount = tree.perks.filter((perk) => build.selectedPerkIds.includes(perk.id)).length;
              const isActive = activeSkillTreeId === tree.skillId;

              return (
                <button
                  key={tree.skillId}
                  type="button"
                  onClick={() => {
                    setActiveSkillTreeId(tree.skillId);
                    setMiddleView("skill-trees");
                  }}
                  className={cn(
                    "rounded-[var(--radius-md)] border p-3 text-left transition-colors",
                    isActive
                      ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10"
                      : "border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)]/20 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]/40",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-[var(--color-foreground)]">
                      <SkillIcon skillId={tree.skillId} className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent-muted)]" />
                      <span className="truncate">{tree.skillName}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-[var(--color-muted)]">
                      {selectedCount}/{tree.perks.length}
                    </span>
                  </div>
                  <PerkTreeMiniView tree={tree} />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
