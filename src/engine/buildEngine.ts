import type { Effect, GameData, Mechanics, Perk, Race } from "@/data/schemas";

export interface Attributes {
  health: number;
  magicka: number;
  stamina: number;
}

export interface BuildState {
  raceId: string | null;
  standingStoneId: string | null;
  blessingId: string | null;
  traitIds: string[];
  majorSkillIds: string[];
  minorSkillIds: string[];
  attributeBonus: Attributes;
  selectedPerkIds: string[];
  skillLevels: Record<string, number>;
  description: string;
}

export interface DerivedStatResult {
  id: string;
  label: string;
  value: number;
  isPercent: boolean;
}

export interface ComputedBuild {
  attributes: Attributes;
  carryWeight: number;
  unarmedDamage: number;
  moveSpeedBonus: number;
  derivedStats: DerivedStatResult[];
  skillLevels: Record<string, number>;
}

function emptyAttributes(): Attributes {
  return { health: 0, magicka: 0, stamina: 0 };
}

function applyEffect(attributes: Attributes, derived: Record<string, number>, effect: Effect): void {
  if (effect.type === "attribute") {
    attributes[effect.stat] += effect.value;
    return;
  }
  derived[effect.stat] = (derived[effect.stat] ?? 0) + effect.value;
}

function resolveRace(game: GameData, raceId: string | null): Race | undefined {
  if (!raceId || raceId === "none") return undefined;
  return game.races.find((race) => race.id === raceId);
}

function collectEffects(game: GameData, state: BuildState): Effect[] {
  const effects: Effect[] = [];

  const race = resolveRace(game, state.raceId);
  if (race) effects.push(...race.effects);

  const stone = game.standingStones.find((s) => s.id === state.standingStoneId);
  if (stone) effects.push(...stone.effects);

  const blessing = game.blessings.find((b) => b.id === state.blessingId);
  if (blessing) effects.push(...blessing.effects);

  for (const traitId of state.traitIds) {
    const trait = game.traits.find((t) => t.id === traitId);
    if (trait) effects.push(...trait.effects);
  }

  for (const perkId of state.selectedPerkIds) {
    for (const tree of Object.values(game.perkTrees)) {
      const perk = tree.perks.find((p) => p.id === perkId);
      if (perk) effects.push(...perk.effects);
    }
  }

  return effects;
}

function computeDerivedStats(
  mechanics: Mechanics,
  attributes: Attributes,
  derivedBonuses: Record<string, number>,
): DerivedStatResult[] {
  return mechanics.derivedStats.map((stat) => {
    const weighted =
      attributes.health * stat.weights.health +
      attributes.magicka * stat.weights.magicka +
      attributes.stamina * stat.weights.stamina;

    const base = stat.prefactor * (weighted / stat.threshold);
    const bonus = derivedBonuses[stat.id] ?? 0;
    const value = Math.round((base + bonus) * 100) / 100;

    return {
      id: stat.id,
      label: stat.label,
      value,
      isPercent: stat.isPercent,
    };
  });
}

export function computeSkillLevels(game: GameData, state: BuildState): Record<string, number> {
  const levels: Record<string, number> = { ...state.skillLevels };

  const race = resolveRace(game, state.raceId);
  if (race) {
    for (const [skillId, value] of Object.entries(race.startingSkills)) {
      levels[skillId] = Math.max(levels[skillId] ?? 0, value);
    }
  }

  for (const skillId of state.majorSkillIds) {
    levels[skillId] = (levels[skillId] ?? 0) + game.mechanics.majorSkillBonus;
  }

  for (const skillId of state.minorSkillIds) {
    levels[skillId] = (levels[skillId] ?? 0) + game.mechanics.minorSkillBonus;
  }

  return levels;
}

export function computeBuild(game: GameData, state: BuildState): ComputedBuild {
  const race = resolveRace(game, state.raceId);
  const baseAttributes = race
    ? {
        health: race.startingAttributes.health + race.attributeBonus.health,
        magicka: race.startingAttributes.magicka + race.attributeBonus.magicka,
        stamina: race.startingAttributes.stamina + race.attributeBonus.stamina,
      }
    : emptyAttributes();

  const attributes: Attributes = {
    health: baseAttributes.health + state.attributeBonus.health,
    magicka: baseAttributes.magicka + state.attributeBonus.magicka,
    stamina: baseAttributes.stamina + state.attributeBonus.stamina,
  };

  const derivedBonuses: Record<string, number> = {};
  for (const effect of collectEffects(game, state)) {
    applyEffect(emptyAttributes(), derivedBonuses, effect);
  }

  for (const effect of collectEffects(game, state)) {
    if (effect.type === "attribute") {
      attributes[effect.stat] += effect.value;
    }
  }

  const derivedStats = computeDerivedStats(game.mechanics, attributes, derivedBonuses);
  const skillLevels = computeSkillLevels(game, state);

  return {
    attributes,
    carryWeight: race?.startingCarryWeight ?? 0,
    unarmedDamage: race?.unarmedDamage ?? 0,
    moveSpeedBonus: race?.speedBonus ?? 0,
    derivedStats,
    skillLevels,
  };
}

export function getPerkById(game: GameData, perkId: string): Perk | undefined {
  for (const tree of Object.values(game.perkTrees)) {
    const perk = tree.perks.find((p) => p.id === perkId);
    if (perk) return perk;
  }
  return undefined;
}

export function arePrerequisitesMet(_game: GameData, state: BuildState, perk: Perk): boolean {
  if (perk.prerequisites.length === 0) return true;
  return perk.prerequisites.every((id) => state.selectedPerkIds.includes(id));
}

export function getSkillLevelForPerk(game: GameData, state: BuildState, perk: Perk): number {
  const tree = Object.values(game.perkTrees).find((t) => t.perks.some((p) => p.id === perk.id));
  if (!tree) return 0;
  return computeSkillLevels(game, state)[tree.skillId] ?? 0;
}

export function canSelectPerk(game: GameData, state: BuildState, perkId: string): boolean {
  const perk = getPerkById(game, perkId);
  if (!perk) return false;
  if (state.selectedPerkIds.includes(perkId)) return true;
  if (!arePrerequisitesMet(game, state, perk)) return false;
  if (getSkillLevelForPerk(game, state, perk) < perk.skillReq) return false;

  const remaining = getRemainingPerkPoints(game, state);
  return remaining > 0;
}

export function getRemainingPerkPoints(game: GameData, state: BuildState): number {
  const total = game.manifest.limits.initialPerkPoints;
  const used = state.selectedPerkIds.length;
  return Math.max(0, total - used);
}

export function getRemainingAttributePoints(game: GameData, state: BuildState): number {
  const total = game.manifest.limits.initialAttributePoints;
  const used =
    state.attributeBonus.health + state.attributeBonus.magicka + state.attributeBonus.stamina;
  return Math.max(0, total - used);
}

export function canSelectMajorSkill(game: GameData, state: BuildState, skillId: string): boolean {
  if (state.majorSkillIds.includes(skillId)) return true;
  if (state.majorSkillIds.length >= game.manifest.limits.majorSkills) return false;
  if (state.minorSkillIds.includes(skillId)) return false;
  const skill = game.skills.find((s) => s.id === skillId);
  return skill?.majorEligible ?? false;
}

export function canSelectMinorSkill(game: GameData, state: BuildState, skillId: string): boolean {
  if (state.minorSkillIds.includes(skillId)) return true;
  if (state.minorSkillIds.length >= game.manifest.limits.minorSkills) return false;
  if (state.majorSkillIds.includes(skillId)) return false;
  const skill = game.skills.find((s) => s.id === skillId);
  return skill?.minorEligible ?? false;
}

export function canSelectTrait(game: GameData, state: BuildState, traitId: string): boolean {
  if (state.traitIds.includes(traitId)) return true;
  return state.traitIds.length < game.manifest.limits.traits;
}

export function getRaceById(game: GameData, raceId: string | null): Race | undefined {
  return resolveRace(game, raceId);
}

export function createInitialBuildState(): BuildState {
  return {
    raceId: "none",
    standingStoneId: "none",
    blessingId: "none",
    traitIds: [],
    majorSkillIds: [],
    minorSkillIds: [],
    attributeBonus: emptyAttributes(),
    selectedPerkIds: [],
    skillLevels: {},
    description: "",
  };
}
