import { z } from "zod";

export const attributeStatSchema = z.enum(["health", "magicka", "stamina"]);

export const effectSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("attribute"),
    stat: attributeStatSchema,
    value: z.number(),
  }),
  z.object({
    type: z.literal("derivedStat"),
    stat: z.string(),
    value: z.number(),
    isPercent: z.boolean().optional(),
  }),
]);

export const manifestSchema = z.object({
  version: z.string(),
  name: z.string(),
  limits: z.object({
    majorSkills: z.number(),
    minorSkills: z.number(),
    traits: z.number(),
    initialPerkPoints: z.number(),
    initialAttributePoints: z.number(),
  }),
  skills: z.array(z.string()),
});

export const mechanicsSchema = z.object({
  leveling: z.object({
    baseLevel: z.number(),
    attributePointsPerLevel: z.tuple([z.number(), z.number(), z.number()]),
  }),
  oghmaInfinium: z.object({
    perkPoints: z.number(),
    attributeBonus: z.tuple([z.number(), z.number(), z.number()]),
  }),
  majorSkillBonus: z.number(),
  minorSkillBonus: z.number(),
  derivedStats: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      isPercent: z.boolean(),
      prefactor: z.number(),
      threshold: z.number(),
      weights: z.object({
        health: z.number(),
        magicka: z.number(),
        stamina: z.number(),
      }),
    }),
  ),
});

export const raceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  bonuses: z.array(z.string()),
  startingAttributes: z.object({
    health: z.number(),
    magicka: z.number(),
    stamina: z.number(),
  }),
  attributeBonus: z.object({
    health: z.number(),
    magicka: z.number(),
    stamina: z.number(),
  }),
  startingCarryWeight: z.number(),
  speedBonus: z.number(),
  unarmedDamage: z.number(),
  regen: z.object({
    health: z.number(),
    magicka: z.number(),
    stamina: z.number(),
  }),
  startingSkills: z.record(z.string(), z.number()),
  effects: z.array(effectSchema),
});

export const racesSchema = z.object({
  races: z.array(raceSchema),
});

export const standingStoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  group: z.string(),
  description: z.string(),
  bonus: z.string(),
  bonusDetails: z.array(z.string()).optional(),
  effects: z.array(effectSchema),
});

export const standingStonesSchema = z.object({
  standingStones: z.array(standingStoneSchema),
});

export const blessingSchema = z.object({
  id: z.string(),
  name: z.string(),
  shrine: z.string(),
  follower: z.string(),
  devotee: z.string(),
  tenets: z.string(),
  race: z.string(),
  starting: z.string(),
  requirement: z.string(),
  effects: z.array(effectSchema),
});

export const blessingsSchema = z.object({
  blessings: z.array(blessingSchema),
});

export const traitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  effects: z.array(effectSchema),
});

export const traitsSchema = z.object({
  traits: z.array(traitSchema),
});

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  majorEligible: z.boolean(),
  minorEligible: z.boolean(),
});

export const skillsSchema = z.object({
  skills: z.array(skillSchema),
});

export const perkSchema = z.object({
  id: z.string(),
  name: z.string(),
  skillReq: z.number(),
  position: z.object({ x: z.number(), y: z.number() }),
  prerequisites: z.array(z.string()),
  description: z.string(),
  effects: z.array(effectSchema),
});

export const perkTreeSchema = z.object({
  skillId: z.string(),
  skillName: z.string(),
  perks: z.array(perkSchema),
});

export const perkIndexSchema = z.record(z.string(), z.string());

export const themeSchema = z.object({
  mode: z.enum(["dark", "light"]),
  colors: z.record(z.string(), z.string()),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  radius: z.record(z.string(), z.string()),
  shadows: z.record(z.string(), z.string()),
});

export const layoutSchema = z.object({
  columns: z.array(
    z.object({
      width: z.string(),
      panels: z.array(z.string()),
    }),
  ),
});

export const labelsSchema = z.object({
  app: z.object({
    title: z.string(),
    subtitle: z.string(),
    versionLabel: z.string(),
    footer: z.string(),
  }),
  nav: z.object({
    home: z.string(),
    planner: z.string(),
    builds: z.string(),
  }),
  landing: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    description: z.string(),
    cta: z.string(),
    ctaHint: z.string(),
    feature1Title: z.string(),
    feature1Description: z.string(),
    feature2Title: z.string(),
    feature2Description: z.string(),
    feature3Title: z.string(),
    feature3Description: z.string(),
    feature4Title: z.string(),
    feature4Description: z.string(),
  }),
  planner: z.object({
    intro: z.string(),
  }),
  panels: z.record(z.string(), z.record(z.string(), z.string())),
  errors: z.record(z.string(), z.string()),
});

export type Effect = z.infer<typeof effectSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
export type Mechanics = z.infer<typeof mechanicsSchema>;
export type Race = z.infer<typeof raceSchema>;
export type StandingStone = z.infer<typeof standingStoneSchema>;
export type Blessing = z.infer<typeof blessingSchema>;
export type Trait = z.infer<typeof traitSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Perk = z.infer<typeof perkSchema>;
export type PerkTree = z.infer<typeof perkTreeSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type Layout = z.infer<typeof layoutSchema>;
export type Labels = z.infer<typeof labelsSchema>;

export interface GameData {
  manifest: Manifest;
  mechanics: Mechanics;
  races: Race[];
  standingStones: StandingStone[];
  blessings: Blessing[];
  traits: Trait[];
  skills: Skill[];
  perkTrees: Record<string, PerkTree>;
}

export interface UiData {
  theme: Theme;
  layout: Layout;
  labels: Labels;
}

export interface AppData {
  game: GameData;
  ui: UiData;
}
