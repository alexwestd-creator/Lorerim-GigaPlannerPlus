import manifestJson from "../../data/game/manifest.json";
import mechanicsJson from "../../data/game/mechanics.json";
import racesJson from "../../data/game/races.json";
import standingStonesJson from "../../data/game/standing-stones.json";
import blessingsJson from "../../data/game/blessings.json";
import traitsJson from "../../data/game/traits.json";
import skillsJson from "../../data/game/skills.json";
import perkIndexJson from "../../data/game/perks/index.json";
import smithingPerksJson from "../../data/game/perks/smithing.json";
import heavyArmorPerksJson from "../../data/game/perks/heavy-armor.json";
import themeJson from "../../data/ui/theme.json";
import layoutJson from "../../data/ui/layout.json";
import labelsJson from "../../data/ui/labels.json";

import {
  manifestSchema,
  mechanicsSchema,
  racesSchema,
  standingStonesSchema,
  blessingsSchema,
  traitsSchema,
  skillsSchema,
  perkIndexSchema,
  perkTreeSchema,
  themeSchema,
  layoutSchema,
  labelsSchema,
  type AppData,
  type PerkTree,
} from "./schemas";

function parse<T>(schema: { parse: (data: unknown) => T }, data: unknown, name: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new Error(`Failed to validate ${name}: ${String(error)}`);
  }
}

const perkTreeFiles: Record<string, unknown> = {
  "smithing.json": smithingPerksJson,
  "heavy-armor.json": heavyArmorPerksJson,
};

export function loadAppData(): AppData {
  const manifest = parse(manifestSchema, manifestJson, "manifest.json");
  const mechanics = parse(mechanicsSchema, mechanicsJson, "mechanics.json");
  const { races } = parse(racesSchema, racesJson, "races.json");
  const { standingStones } = parse(standingStonesSchema, standingStonesJson, "standing-stones.json");
  const { blessings } = parse(blessingsSchema, blessingsJson, "blessings.json");
  const { traits } = parse(traitsSchema, traitsJson, "traits.json");
  const { skills } = parse(skillsSchema, skillsJson, "skills.json");
  const perkIndex = parse(perkIndexSchema, perkIndexJson, "perks/index.json");

  const perkTrees: Record<string, PerkTree> = {};
  for (const [skillId, filename] of Object.entries(perkIndex)) {
    const raw = perkTreeFiles[filename];
    if (!raw) {
      throw new Error(`Missing perk tree file: ${filename}`);
    }
    perkTrees[skillId] = parse(perkTreeSchema, raw, filename);
  }

  const theme = parse(themeSchema, themeJson, "theme.json");
  const layout = parse(layoutSchema, layoutJson, "layout.json");
  const labels = parse(labelsSchema, labelsJson, "labels.json");

  return {
    game: {
      manifest,
      mechanics,
      races,
      standingStones,
      blessings,
      traits,
      skills,
      perkTrees,
    },
    ui: { theme, layout, labels },
  };
}
