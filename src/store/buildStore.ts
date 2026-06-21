import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppData } from "@/data/schemas";
import {
  canSelectMajorSkill,
  canSelectMinorSkill,
  canSelectPerk,
  canSelectTrait,
  computeBuild,
  createInitialBuildState,
  type Attributes,
  type BuildState,
  type ComputedBuild,
} from "@/engine/buildEngine";
import {
  createInitialLibrary,
  createSavedBuild,
  migrateLegacyStorage,
  nextBuildName,
  reorderBuildsInList,
  updateSavedBuildInList,
  type SavedBuild,
  LIBRARY_STORAGE_KEY,
} from "@/store/savedBuilds";

interface BuildStore {
  gameData: AppData | null;
  build: BuildState;
  savedBuilds: SavedBuild[];
  activeBuildId: string;
  computed: ComputedBuild | null;
  init: (data: AppData) => void;
  setRace: (raceId: string) => void;
  setStandingStone: (stoneId: string) => void;
  setBlessing: (blessingId: string) => void;
  toggleTrait: (traitId: string) => void;
  toggleMajorSkill: (skillId: string) => void;
  toggleMinorSkill: (skillId: string) => void;
  adjustAttribute: (stat: keyof Attributes, delta: number) => void;
  togglePerk: (perkId: string) => void;
  resetSkillPerks: (skillId: string) => void;
  resetAllPerks: () => void;
  setDescription: (description: string) => void;
  loadBuild: (build: BuildState) => void;
  resetBuild: () => void;
  createSavedBuildSlot: (name?: string) => void;
  deleteSavedBuildSlot: (id: string) => void;
  renameSavedBuildSlot: (id: string, name: string) => void;
  selectSavedBuildSlot: (id: string) => void;
  importBuildAsSlot: (build: BuildState, name?: string) => void;
  importBuildLibrary: (entries: Array<{ name: string; build: BuildState; updatedAt?: number }>) => void;
  reorderSavedBuildSlot: (fromIndex: number, toIndex: number) => void;
}

function recompute(data: AppData, build: BuildState): ComputedBuild {
  return computeBuild(data.game, build);
}

function commitBuild(
  set: (partial: Partial<BuildStore>) => void,
  get: () => BuildStore,
  nextBuild: BuildState,
): void {
  const { gameData, savedBuilds, activeBuildId } = get();
  if (!gameData) return;

  set({
    build: nextBuild,
    savedBuilds: updateSavedBuildInList(savedBuilds, activeBuildId, nextBuild),
    computed: recompute(gameData, nextBuild),
  });
}

function activateBuild(
  set: (partial: Partial<BuildStore>) => void,
  get: () => BuildStore,
  buildId: string,
  savedBuilds: SavedBuild[],
): void {
  const { gameData } = get();
  const entry = savedBuilds.find((b) => b.id === buildId);
  if (!entry || !gameData) return;

  set({
    activeBuildId: buildId,
    build: entry.build,
    savedBuilds,
    computed: recompute(gameData, entry.build),
  });
}

export const useBuildStore = create<BuildStore>()(
  persist(
    (set, get) => {
      const initialLibrary = migrateLegacyStorage() ?? createInitialLibrary();
      const activeEntry =
        initialLibrary.savedBuilds.find((b) => b.id === initialLibrary.activeBuildId) ??
        initialLibrary.savedBuilds[0];

      return {
        gameData: null,
        build: activeEntry?.build ?? createInitialBuildState(),
        savedBuilds: initialLibrary.savedBuilds,
        activeBuildId: activeEntry?.id ?? initialLibrary.activeBuildId,
        computed: null,

        init: (data) => {
          const { build } = get();
          set({ gameData: data, computed: recompute(data, build) });
        },

        setRace: (raceId) => {
          const { build } = get();
          commitBuild(set, get, { ...build, raceId });
        },

        setStandingStone: (stoneId) => {
          const { build } = get();
          commitBuild(set, get, { ...build, standingStoneId: stoneId });
        },

        setBlessing: (blessingId) => {
          const { build } = get();
          commitBuild(set, get, { ...build, blessingId });
        },

        toggleTrait: (traitId) => {
          const { gameData, build } = get();
          if (!gameData) return;

          let traitIds = [...build.traitIds];
          if (traitIds.includes(traitId)) {
            traitIds = traitIds.filter((id) => id !== traitId);
          } else if (canSelectTrait(gameData.game, build, traitId)) {
            traitIds.push(traitId);
          }

          commitBuild(set, get, { ...build, traitIds });
        },

        toggleMajorSkill: (skillId) => {
          const { gameData, build } = get();
          if (!gameData) return;

          let majorSkillIds = [...build.majorSkillIds];
          if (majorSkillIds.includes(skillId)) {
            majorSkillIds = majorSkillIds.filter((id) => id !== skillId);
          } else if (canSelectMajorSkill(gameData.game, build, skillId)) {
            majorSkillIds.push(skillId);
          }

          commitBuild(set, get, { ...build, majorSkillIds });
        },

        toggleMinorSkill: (skillId) => {
          const { gameData, build } = get();
          if (!gameData) return;

          let minorSkillIds = [...build.minorSkillIds];
          if (minorSkillIds.includes(skillId)) {
            minorSkillIds = minorSkillIds.filter((id) => id !== skillId);
          } else if (canSelectMinorSkill(gameData.game, build, skillId)) {
            minorSkillIds.push(skillId);
          }

          commitBuild(set, get, { ...build, minorSkillIds });
        },

        adjustAttribute: (stat, delta) => {
          const { gameData, build } = get();
          if (!gameData) return;

          const current = build.attributeBonus[stat];
          const nextValue = current + delta;
          if (nextValue < 0) return;

          const totalUsed =
            build.attributeBonus.health +
            build.attributeBonus.magicka +
            build.attributeBonus.stamina -
            current +
            nextValue;
          if (totalUsed > gameData.game.manifest.limits.initialAttributePoints) return;

          commitBuild(set, get, {
            ...build,
            attributeBonus: { ...build.attributeBonus, [stat]: nextValue },
          });
        },

        togglePerk: (perkId) => {
          const { gameData, build } = get();
          if (!gameData) return;

          let selectedPerkIds = [...build.selectedPerkIds];
          if (selectedPerkIds.includes(perkId)) {
            selectedPerkIds = selectedPerkIds.filter((id) => id !== perkId);
          } else if (canSelectPerk(gameData.game, build, perkId)) {
            selectedPerkIds.push(perkId);
          }

          commitBuild(set, get, { ...build, selectedPerkIds });
        },

        resetSkillPerks: (skillId) => {
          const { gameData, build } = get();
          if (!gameData) return;

          const tree = gameData.game.perkTrees[skillId];
          if (!tree) return;

          const skillPerkIds = new Set(tree.perks.map((p) => p.id));
          const selectedPerkIds = build.selectedPerkIds.filter((id) => !skillPerkIds.has(id));
          commitBuild(set, get, { ...build, selectedPerkIds });
        },

        resetAllPerks: () => {
          const { build } = get();
          commitBuild(set, get, { ...build, selectedPerkIds: [] });
        },

        setDescription: (description) => {
          const { build } = get();
          commitBuild(set, get, { ...build, description });
        },

        loadBuild: (build) => {
          commitBuild(set, get, build);
        },

        resetBuild: () => {
          commitBuild(set, get, createInitialBuildState());
        },

        createSavedBuildSlot: (name) => {
          const { savedBuilds, build, activeBuildId, gameData } = get();
          if (!gameData) return;

          const syncedBuilds = updateSavedBuildInList(savedBuilds, activeBuildId, build);
          const freshBuild = createInitialBuildState();
          const newEntry = createSavedBuild(name?.trim() || nextBuildName(syncedBuilds), freshBuild);

          set({
            savedBuilds: [...syncedBuilds, newEntry],
            activeBuildId: newEntry.id,
            build: freshBuild,
            computed: recompute(gameData, freshBuild),
          });
        },

        deleteSavedBuildSlot: (id) => {
          const { savedBuilds, activeBuildId, build, gameData } = get();
          if (!gameData || savedBuilds.length <= 1) return;

          const syncedBuilds = updateSavedBuildInList(savedBuilds, activeBuildId, build);
          const remaining = syncedBuilds.filter((entry) => entry.id !== id);
          if (remaining.length === 0) return;

          const nextActive =
            id === activeBuildId ? remaining[0] : remaining.find((entry) => entry.id === activeBuildId)!;

          set({
            savedBuilds: remaining,
            activeBuildId: nextActive.id,
            build: nextActive.build,
            computed: recompute(gameData, nextActive.build),
          });
        },

        renameSavedBuildSlot: (id, name) => {
          const trimmed = name.trim();
          if (!trimmed) return;

          const { savedBuilds } = get();
          set({
            savedBuilds: savedBuilds.map((entry) =>
              entry.id === id ? { ...entry, name: trimmed, updatedAt: Date.now() } : entry,
            ),
          });
        },

        selectSavedBuildSlot: (id) => {
          const { savedBuilds, activeBuildId, build } = get();
          if (id === activeBuildId) return;

          const syncedBuilds = updateSavedBuildInList(savedBuilds, activeBuildId, build);
          activateBuild(set, get, id, syncedBuilds);
        },

        importBuildAsSlot: (importedBuild, name) => {
          const { savedBuilds, build, activeBuildId, gameData } = get();
          if (!gameData) return;

          const syncedBuilds = updateSavedBuildInList(savedBuilds, activeBuildId, build);
          const newEntry = createSavedBuild(
            name?.trim() || nextBuildName(syncedBuilds),
            importedBuild,
          );

          set({
            savedBuilds: [...syncedBuilds, newEntry],
            activeBuildId: newEntry.id,
            build: importedBuild,
            computed: recompute(gameData, importedBuild),
          });
        },

        importBuildLibrary: (entries) => {
          const { gameData } = get();
          if (!gameData || entries.length === 0) return;

          const imported = entries.map((entry) =>
            createSavedBuild(entry.name, entry.build),
          );
          for (let i = 0; i < imported.length; i += 1) {
            if (entries[i]?.updatedAt) {
              imported[i] = { ...imported[i], updatedAt: entries[i].updatedAt! };
            }
          }

          const active = imported[0];
          set({
            savedBuilds: imported,
            activeBuildId: active.id,
            build: active.build,
            computed: recompute(gameData, active.build),
          });
        },

        reorderSavedBuildSlot: (fromIndex, toIndex) => {
          const { savedBuilds, activeBuildId, build } = get();
          const syncedBuilds = updateSavedBuildInList(savedBuilds, activeBuildId, build);
          set({ savedBuilds: reorderBuildsInList(syncedBuilds, fromIndex, toIndex) });
        },
      };
    },
    {
      name: LIBRARY_STORAGE_KEY,
      partialize: (state) => ({
        build: state.build,
        savedBuilds: state.savedBuilds,
        activeBuildId: state.activeBuildId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.gameData) return;
        if (state.build.raceId === null) {
          state.build = { ...state.build, raceId: "none" };
        }
        state.computed = recompute(state.gameData, state.build);
      },
    },
  ),
);
