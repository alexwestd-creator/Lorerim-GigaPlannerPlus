import type { BuildState } from "@/engine/buildEngine";
import { createInitialBuildState } from "@/engine/buildEngine";

export interface SavedBuild {
  id: string;
  name: string;
  build: BuildState;
  updatedAt: number;
}

export interface BuildLibraryState {
  savedBuilds: SavedBuild[];
  activeBuildId: string;
}

const LEGACY_STORAGE_KEY = "lorerim-build";
const LIBRARY_STORAGE_KEY = "lorerim-build-library";

export function createBuildId(): string {
  return crypto.randomUUID();
}

export function defaultBuildName(index: number): string {
  return `Build ${index}`;
}

export function createSavedBuild(name: string, build: BuildState): SavedBuild {
  return {
    id: createBuildId(),
    name,
    build,
    updatedAt: Date.now(),
  };
}

export function nextBuildName(builds: SavedBuild[]): string {
  const used = new Set(builds.map((b) => b.name));
  let index = builds.length + 1;
  while (used.has(defaultBuildName(index))) {
    index += 1;
  }
  return defaultBuildName(index);
}

export function touchSavedBuild(saved: SavedBuild, build: BuildState): SavedBuild {
  return { ...saved, build, updatedAt: Date.now() };
}

export function updateSavedBuildInList(
  builds: SavedBuild[],
  activeBuildId: string,
  build: BuildState,
): SavedBuild[] {
  return builds.map((entry) =>
    entry.id === activeBuildId ? touchSavedBuild(entry, build) : entry,
  );
}

export function reorderBuildsInList(
  builds: SavedBuild[],
  fromIndex: number,
  toIndex: number,
): SavedBuild[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= builds.length ||
    toIndex >= builds.length
  ) {
    return builds;
  }

  const next = [...builds];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function migrateLegacyStorage(): BuildLibraryState | null {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { state?: { build?: BuildState } };
    const build = parsed.state?.build;
    if (!build) return null;

    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const entry = createSavedBuild(defaultBuildName(1), build);
    return {
      savedBuilds: [entry],
      activeBuildId: entry.id,
    };
  } catch {
    return null;
  }
}

export function createInitialLibrary(): BuildLibraryState {
  const build = createInitialBuildState();

  const entry = createSavedBuild(defaultBuildName(1), build);
  return {
    savedBuilds: [entry],
    activeBuildId: entry.id,
  };
}

export { LIBRARY_STORAGE_KEY };
