import { writeFileSync } from "node:fs";

const skillIds = [
  "smithing",
  "heavy-armor",
  "block",
  "two-handed",
  "one-handed",
  "marksman",
  "evasion",
  "sneak",
  "wayfarer",
  "finesse",
  "speech",
  "alchemy",
  "illusion",
  "conjuration",
  "destruction",
  "restoration",
  "alteration",
  "enchanting",
  "destiny",
  "traits",
];

const raw = await fetch(
  "https://raw.githubusercontent.com/MultiDyls/GigaPlanner/main/raceListData.js",
).then((r) => r.text());

const arrayText = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
const raceListData = eval(`(${arrayText})`);

function parseBonuses(text) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&#x2022;|&bull;/gi, "•")
    .split(/\n| • /)
    .map((part) => part.replace(/^•\s*/, "").trim())
    .filter(Boolean);
}

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const races = raceListData.map((race) => {
  const startingSkills = {};
  skillIds.forEach((id, index) => {
    startingSkills[id] = race.startingSkills[index] ?? 0;
  });

  return {
    id: slugify(race.name),
    name: race.name,
    description: race.desc,
    bonuses: parseBonuses(race.bonus),
    startingAttributes: {
      health: race.startingHMS[0],
      magicka: race.startingHMS[1],
      stamina: race.startingHMS[2],
    },
    attributeBonus: {
      health: race.hmsBonus[0],
      magicka: race.hmsBonus[1],
      stamina: race.hmsBonus[2],
    },
    startingCarryWeight: race.startingCW,
    speedBonus: race.speedBonus,
    unarmedDamage: race.unarmedDam,
    regen: {
      health: race.startingHMSRegen[0],
      magicka: race.startingHMSRegen[1],
      stamina: race.startingHMSRegen[2],
    },
    startingSkills,
    effects: [],
  };
});

writeFileSync("data/game/races.json", JSON.stringify({ races }, null, 2));
console.log(`Wrote ${races.length} races`);
