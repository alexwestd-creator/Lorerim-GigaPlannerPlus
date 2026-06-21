import { useUiStore } from "@/store/uiStore";
import { CharacterSetupInfoPanel } from "@/panels/CharacterSetupInfoPanel";
import { SetupPickerPanel } from "@/panels/SetupPickerPanel";
import { SkillTreePanel } from "@/panels/SkillTreePanel";

export function MiddleWorkspacePanel() {
  const setupPicker = useUiStore((s) => s.setupPicker);
  const middleView = useUiStore((s) => s.middleView);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {setupPicker ? (
        <SetupPickerPanel />
      ) : middleView === "skill-trees" ? (
        <SkillTreePanel />
      ) : (
        <CharacterSetupInfoPanel />
      )}
    </div>
  );
}
