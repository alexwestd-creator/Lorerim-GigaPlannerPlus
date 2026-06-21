import { create } from "zustand";

export type SetupPicker =
  | "race"
  | "standing-stone"
  | "blessing"
  | "traits"
  | "major-skills"
  | "minor-skills";

export type MiddleWorkspaceView = "character-info" | "skill-trees";

interface UiStore {
  setupPicker: SetupPicker | null;
  middleView: MiddleWorkspaceView;
  activeSkillTreeId: string | null;
  setSetupPicker: (picker: SetupPicker | null) => void;
  toggleSetupPicker: (picker: SetupPicker) => void;
  setMiddleView: (view: MiddleWorkspaceView) => void;
  setActiveSkillTreeId: (skillId: string) => void;
}

export const useUiStore = create<UiStore>((set, get) => ({
  setupPicker: null,
  middleView: "character-info",
  activeSkillTreeId: null,
  setSetupPicker: (picker) => set({ setupPicker: picker }),
  toggleSetupPicker: (picker) => {
    const current = get().setupPicker;
    set({ setupPicker: current === picker ? null : picker });
  },
  setMiddleView: (view) => set({ middleView: view }),
  setActiveSkillTreeId: (skillId) => set({ activeSkillTreeId: skillId }),
}));
