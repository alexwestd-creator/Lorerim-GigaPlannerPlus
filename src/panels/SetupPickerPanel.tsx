import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PickerOptionTile } from "@/components/picker/PickerListItem";
import { PickerSearchInput, matchesPickerSearch } from "@/components/PickerSearchInput";
import { SkillIcon } from "@/components/SkillIcon";import { BlessingDetailContent } from "@/components/option-details/BlessingDetailContent";
import { RaceDetailContent } from "@/components/option-details/RaceDetailContent";
import { StandingStoneDetailContent } from "@/components/option-details/StandingStoneDetailContent";
import { TraitDetailContent } from "@/components/option-details/TraitDetailContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StandingStone } from "@/data/schemas";
import {
  canSelectMajorSkill,
  canSelectMinorSkill,
  canSelectTrait,
} from "@/engine/buildEngine";
import { cn } from "@/lib/utils";import { SingleSelectPickerView, type SingleSelectOption } from "@/panels/SingleSelectPickerView";
import { useUiStore, type SetupPicker } from "@/store/uiStore";
import { usePanelLabels } from "@/theme/ThemeProvider";
import { useBuildStore } from "@/store/buildStore";

function standingStoneDetails(stone: StandingStone): string[] {
  if (stone.bonusDetails?.length) return stone.bonusDetails;
  if (stone.bonus.trim()) return [stone.bonus];
  return [];
}

function pickerTitle(picker: SetupPicker, labels: Record<string, string>): string {
  switch (picker) {
    case "race":
      return labels.race;
    case "standing-stone":
      return labels.standingStone;
    case "blessing":
      return labels.blessing;
    case "traits":
      return labels.traits;
    case "major-skills":
      return labels.majorSkills;
    case "minor-skills":
      return labels.minorSkills;
  }
}

function isDetailPicker(picker: SetupPicker): boolean {
  return (
    picker === "race" ||
    picker === "standing-stone" ||
    picker === "blessing" ||
    picker === "traits"
  );
}

function pickerRemaining(
  picker: SetupPicker,
  game: NonNullable<ReturnType<typeof useBuildStore.getState>["gameData"]>["game"],
  build: ReturnType<typeof useBuildStore.getState>["build"],
): number {
  switch (picker) {
    case "traits":
      return game.manifest.limits.traits - build.traitIds.length;
    case "major-skills":
      return game.manifest.limits.majorSkills - build.majorSkillIds.length;
    case "minor-skills":
      return game.manifest.limits.minorSkills - build.minorSkillIds.length;
    default:
      return 0;
  }
}

interface MultiSelectOption {
  id: string;
  name: string;
  isSelected: boolean;
  isEnabled: boolean;
  onSelect: () => void;
}

export function SetupPickerPanel() {
  const labels = usePanelLabels("character-setup");
  const setupPicker = useUiStore((s) => s.setupPicker);
  const setSetupPicker = useUiStore((s) => s.setSetupPicker);
  const gameData = useBuildStore((s) => s.gameData);
  const build = useBuildStore((s) => s.build);
  const setRace = useBuildStore((s) => s.setRace);
  const setStandingStone = useBuildStore((s) => s.setStandingStone);
  const setBlessing = useBuildStore((s) => s.setBlessing);
  const toggleTrait = useBuildStore((s) => s.toggleTrait);
  const toggleMajorSkill = useBuildStore((s) => s.toggleMajorSkill);
  const toggleMinorSkill = useBuildStore((s) => s.toggleMinorSkill);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

  useEffect(() => {
    setSkillSearchQuery("");
  }, [setupPicker]);

  if (!gameData || !setupPicker) return null;

  const { game } = gameData;
  const detailPicker = isDetailPicker(setupPicker);
  const showRemaining =
    setupPicker === "traits" ||
    setupPicker === "major-skills" ||
    setupPicker === "minor-skills";
  const remaining = showRemaining ? pickerRemaining(setupPicker, game, build) : null;
  const title = pickerTitle(setupPicker, labels);

  const detailLabels = {
    baseStats: labels.baseStats,
    startingSkills: labels.startingSkills,
    bonuses: labels.bonuses,
    health: labels.health,
    magicka: labels.magicka,
    stamina: labels.stamina,
    healthRegen: labels.healthRegen,
    magickaRegen: labels.magickaRegen,
    staminaRegen: labels.staminaRegen,
    carryWeight: labels.carryWeight,
    unarmedDamage: labels.unarmedDamage,
  };

  let detailOptions: SingleSelectOption[] = [];
  let focusId: string | null = null;
  let multiSelectOptions: MultiSelectOption[] = [];

  if (setupPicker === "race") {
    focusId = build.raceId ?? "none";
    detailOptions = game.races.map((race) => ({
      id: race.id,
      name: race.name,
      isSelected: (build.raceId ?? "none") === race.id,
      onSelect: () => setRace(race.id),
      detail:
        race.id === "none" ? (
          <p className="text-sm text-[var(--color-muted)]">
            No race bonuses will be applied to this build.
          </p>
        ) : (
          <RaceDetailContent
            race={race}
            skills={game.skills}
            labels={detailLabels}
            hideHeader
          />
        ),
    }));
  } else if (setupPicker === "standing-stone") {
    focusId = build.standingStoneId ?? "none";
    detailOptions = game.standingStones.map((stone) => ({
      id: stone.id,
      name: stone.name,
      isSelected: (build.standingStoneId ?? "none") === stone.id,
      onSelect: () => setStandingStone(stone.id),
      detail:
        stone.id === "none" ? (
          <p className="text-sm text-[var(--color-muted)]">
            No standing stone bonus will be applied to this build.
          </p>
        ) : (
          <StandingStoneDetailContent
            stone={{ ...stone, bonusDetails: standingStoneDetails(stone) }}
            labels={{ bonuses: labels.bonuses }}
            hideHeader
          />
        ),
    }));
  } else if (setupPicker === "blessing") {
    focusId = build.blessingId ?? "none";
    detailOptions = game.blessings.map((blessing) => ({
      id: blessing.id,
      name: blessing.name,
      isSelected: (build.blessingId ?? "none") === blessing.id,
      onSelect: () => setBlessing(blessing.id),
      detail:
        blessing.id === "none" ? (
          <p className="text-sm text-[var(--color-muted)]">
            No divine blessing will be applied to this build.
          </p>
        ) : (
          <BlessingDetailContent
            blessing={blessing}
            races={game.races}
            labels={{
              races: labels.races,
              shrine: labels.shrineBonus,
              follower: labels.followerBonus,
              devotee: labels.devoteeBonus,
              startingRaces: labels.startingRaces,
            }}
            hideHeader
          />
        ),
    }));
  } else if (setupPicker === "traits") {
    focusId = build.traitIds[0] ?? null;
    detailOptions = game.traits.map((trait) => ({
      id: trait.id,
      name: trait.name,
      isSelected: build.traitIds.includes(trait.id),
      isEnabled: canSelectTrait(game, build, trait.id),
      onSelect: () => toggleTrait(trait.id),
      detail: (
        <TraitDetailContent
          trait={trait}
          mechanics={game.mechanics}
          labels={{ bonuses: labels.bonuses }}
          hideHeader
        />
      ),
    }));
  } else {
    multiSelectOptions = game.skills
      .filter((skill) => skill.majorEligible || skill.minorEligible)
      .map((skill) => {
        const isMajor = setupPicker === "major-skills";
        const selectedIds = isMajor ? build.majorSkillIds : build.minorSkillIds;
        const canSelect = isMajor
          ? canSelectMajorSkill(game, build, skill.id)
          : canSelectMinorSkill(game, build, skill.id);

        return {
          id: skill.id,
          name: skill.name,
          isSelected: selectedIds.includes(skill.id),
          isEnabled: canSelect,
          onSelect: () => (isMajor ? toggleMajorSkill(skill.id) : toggleMinorSkill(skill.id)),
        };
      });
  }

  const filteredSkillOptions = useMemo(
    () =>
      multiSelectOptions.filter((option) =>
        matchesPickerSearch(skillSearchQuery, [option.name]),
      ),
    [multiSelectOptions, skillSearchQuery],
  );

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 flex-row items-center justify-between gap-3 space-y-0 border-b border-[var(--color-border)]/50 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {remaining !== null && (
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              {remaining} {labels.remaining ?? "remaining"}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setSetupPicker(null)}>
          <ChevronLeft className="h-4 w-4" />
          {labels.backToOverview ?? "Overview"}
        </Button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-3">        {detailPicker ? (
          <SingleSelectPickerView
            key={setupPicker}
            options={detailOptions}
            selectedId={focusId}
            emptyDetail="Select an option to view details."
            searchPlaceholder={labels.search}
            noMatchesLabel={labels.noMatches}
            selectedLabel={labels.selected}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <PickerSearchInput
              value={skillSearchQuery}
              onChange={setSkillSearchQuery}
              placeholder={labels.search}
              className="max-w-sm"
            />
            <ScrollArea className="min-h-0 flex-1">
              <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSkillOptions.length === 0 ? (
                  <p className="col-span-full px-2 py-6 text-center text-sm text-[var(--color-muted)]">
                    {labels.noMatches ?? "No matches"}
                  </p>
                ) : (
                  filteredSkillOptions.map((option) => (
                    <PickerOptionTile
                      key={option.id}
                      name={option.name}
                      isSelected={option.isSelected}
                      isEnabled={option.isEnabled}
                      onSelect={option.onSelect}
                      leading={
                        <SkillIcon
                          skillId={option.id}
                          className={cn(
                            "h-4 w-4",
                            option.isSelected
                              ? "text-[var(--color-accent)]"
                              : "text-[var(--color-muted)]",
                          )}
                        />
                      }
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}      </CardContent>
    </Card>
  );
}
