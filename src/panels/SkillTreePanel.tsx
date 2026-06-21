import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerkTreeView } from "@/components/PerkTreeView";
import { SkillIcon } from "@/components/SkillIcon";
import { useUiStore } from "@/store/uiStore";
import { usePanelLabels } from "@/theme/ThemeProvider";
import { useBuildStore } from "@/store/buildStore";

export function SkillTreePanel() {
  const labels = usePanelLabels("skill-trees");
  const setupLabels = usePanelLabels("character-setup");
  const setMiddleView = useUiStore((s) => s.setMiddleView);
  const activeSkillTreeId = useUiStore((s) => s.activeSkillTreeId);
  const setActiveSkillTreeId = useUiStore((s) => s.setActiveSkillTreeId);
  const gameData = useBuildStore((s) => s.gameData);
  const resetSkillPerks = useBuildStore((s) => s.resetSkillPerks);
  const resetAllPerks = useBuildStore((s) => s.resetAllPerks);

  if (!gameData) return null;

  const trees = Object.values(gameData.game.perkTrees);
  const activeTab = activeSkillTreeId ?? trees[0]?.skillId ?? "";

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 flex-row items-center justify-between space-y-0">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="sm" className="shrink-0 px-2" onClick={() => setMiddleView("character-info")}>
            <ChevronLeft className="h-4 w-4" />
            {setupLabels.backToOverview ?? setupLabels.title}
          </Button>
          <CardTitle>{labels.title}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetAllPerks}>
            {labels.resetAll}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-4 pt-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveSkillTreeId}
          className="flex h-full flex-col"
        >
          <TabsList className="mb-3 flex-shrink-0 flex-wrap">
            {trees.map((tree) => (
              <TabsTrigger key={tree.skillId} value={tree.skillId} className="gap-1.5">
                <SkillIcon skillId={tree.skillId} className="h-3.5 w-3.5" />
                {tree.skillName}
              </TabsTrigger>
            ))}
          </TabsList>
          {trees.map((tree) => (
            <TabsContent key={tree.skillId} value={tree.skillId} className="min-h-0 flex-1">
              <div className="mb-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => resetSkillPerks(tree.skillId)}>
                  {labels.resetSkill}
                </Button>
              </div>
              <ScrollArea className="h-full min-h-0 w-full">
                <PerkTreeView tree={tree} labels={labels} />
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
