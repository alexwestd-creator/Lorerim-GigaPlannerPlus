import type { Race, Skill } from "@/data/schemas";
import { SkillIcon } from "@/components/SkillIcon";
import { formatRegenPercent } from "@/lib/parseBonuses";
import {
  DetailBulletList,
  DetailSection,
  DetailStatRow,
} from "@/components/option-details/DetailSection";

const STARTING_SKILL_IDS = [
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
] as const;

interface RaceDetailContentProps {
  race: Race;
  skills: Skill[];
  labels: {
    baseStats: string;
    startingSkills: string;
    bonuses: string;
    health: string;
    magicka: string;
    stamina: string;
    healthRegen: string;
    magickaRegen: string;
    staminaRegen: string;
    carryWeight: string;
    unarmedDamage: string;
  };
  hideHeader?: boolean;
}

export function RaceDetailContent({ race, skills, labels, hideHeader }: RaceDetailContentProps) {
  const skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
  const startingSkills = STARTING_SKILL_IDS.filter(
    (skillId) => (race.startingSkills[skillId] ?? 0) > 0,
  );

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-accent)]">
            {race.name}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">{race.description}</p>
        </div>
      )}
      {hideHeader && (
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">{race.description}</p>
      )}

      <DetailSection title={labels.baseStats} className="space-y-1.5">
        <div className="divide-y divide-[var(--color-border)]/50 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)]/30">
          <DetailStatRow label={labels.health} value={race.startingAttributes.health} />
          <DetailStatRow label={labels.magicka} value={race.startingAttributes.magicka} />
          <DetailStatRow label={labels.stamina} value={race.startingAttributes.stamina} />
          <DetailStatRow
            label={labels.healthRegen}
            value={formatRegenPercent(race.regen.health)}
          />
          <DetailStatRow
            label={labels.magickaRegen}
            value={formatRegenPercent(race.regen.magicka)}
          />
          <DetailStatRow
            label={labels.staminaRegen}
            value={formatRegenPercent(race.regen.stamina)}
          />
          <DetailStatRow label={labels.carryWeight} value={race.startingCarryWeight} />
          <DetailStatRow label={labels.unarmedDamage} value={race.unarmedDamage} />
        </div>
      </DetailSection>

      {startingSkills.length > 0 && (
        <DetailSection title={labels.startingSkills} className="space-y-1.5">
          <div className="divide-y divide-[var(--color-border)]/50 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)]/30">
            {startingSkills.map((skillId) => (
              <DetailStatRow
                key={skillId}
                label={skillNames.get(skillId) ?? skillId}
                value={race.startingSkills[skillId] ?? 0}
                leading={<SkillIcon skillId={skillId} className="h-3.5 w-3.5" />}
              />
            ))}
          </div>
        </DetailSection>
      )}

      {race.bonuses.length > 0 && (
        <DetailSection title={labels.bonuses}>
          <DetailBulletList items={race.bonuses} />
        </DetailSection>
      )}
    </div>
  );
}
