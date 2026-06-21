import { ChevronRight, X } from "lucide-react";
import { SkillIcon } from "@/components/SkillIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUiStore, type SetupPicker } from "@/store/uiStore";
import { usePanelLabels } from "@/theme/ThemeProvider";
import { useBuildStore } from "@/store/buildStore";

interface SelectedChip {
  id: string;
  label: string;
  icon?: boolean;
}

interface SelectionChipProps {
  item: SelectedChip;
  onRemove?: () => void;
}

function SelectionChip({ item, onRemove }: SelectionChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={!onRemove}
      className={cn(
        "group inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--color-border)]/50",
        "bg-[var(--color-background)]/60 py-0.5 pl-1.5 text-[11px] leading-tight text-[var(--color-foreground)]",
        onRemove &&
          "cursor-pointer pr-1 hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-accent)]/8 hover:text-[var(--color-accent)]",
        !onRemove && "cursor-default pr-1.5",
      )}
    >
      {item.icon && (
        <SkillIcon
          skillId={item.id}
          className="h-3 w-3 text-[var(--color-accent-muted)] group-hover:text-[var(--color-accent)]"
        />
      )}
      <span className="truncate font-medium">{item.label}</span>
      {onRemove && (
        <X className="h-3 w-3 shrink-0 text-[var(--color-muted)] opacity-50 group-hover:text-[var(--color-accent)] group-hover:opacity-100" />
      )}
    </button>
  );
}

interface SetupPickerRowProps {
  label: string;
  picker: SetupPicker;
  isActive: boolean;
  onOpen: () => void;
  selectedItems: SelectedChip[];
  onRemove?: (index: number) => void;
  remaining?: number;
  multi?: boolean;
  noneLabel: string;
}

function rowSummary(
  selectedItems: SelectedChip[],
  remaining: number | undefined,
  noneLabel: string,
): string {
  if (selectedItems.length === 0) return noneLabel;
  if (remaining !== undefined && selectedItems.length > 1) {
    return `${selectedItems.length} selected`;
  }
  return selectedItems[0].label;
}

function SetupPickerRow({
  label,
  picker,
  isActive,
  onOpen,
  selectedItems,
  onRemove,
  remaining,
  multi = false,
  noneLabel,
}: SetupPickerRowProps) {
  const hasSelection = selectedItems.length > 0;
  const subline = multi
    ? hasSelection
      ? null
      : noneLabel
    : rowSummary(selectedItems, remaining, noneLabel);
  const isEmpty = !hasSelection;

  return (
    <div className="space-y-1">
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "group flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)] border px-2.5 py-2 text-left transition-colors",
            isActive
              ? "border-[var(--color-accent)]/45 bg-[var(--color-accent)]/8"
              : "border-[var(--color-border)]/70 bg-[var(--color-surface-elevated)]/40 hover:border-[var(--color-accent-muted)]/60 hover:bg-[var(--color-surface-elevated)]",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {label}
            </div>
            {subline !== null && (
              <div
                className={cn(
                  "truncate text-sm font-medium",
                  isEmpty ? "text-[var(--color-muted)]" : "text-[var(--color-foreground)]",
                )}
              >
                {subline}
              </div>
            )}
          </div>
          {remaining !== undefined && (
            <span className="shrink-0 rounded-full bg-[var(--color-background)]/80 px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--color-muted)]">
              {remaining}
            </span>
          )}
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-[var(--color-muted)] transition-colors",
              "group-hover:text-[var(--color-accent)]",
              isActive && "text-[var(--color-accent)]",
            )}
          />
        </button>
        {!multi && hasSelection && onRemove && (
          <button
            type="button"
            onClick={() => onRemove(0)}
            aria-label={`Clear ${label}`}
            className="flex shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)]/70 px-2 text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-accent)]/8 hover:text-[var(--color-accent)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {multi && hasSelection && (
        <div className="flex flex-wrap gap-1 px-0.5">
          {selectedItems.map((item, index) => (
            <SelectionChip
              key={`${picker}-${item.id}`}
              item={item}
              onRemove={onRemove ? () => onRemove(index) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CharacterSetupPanel() {
  const labels = usePanelLabels("character-setup");
  const gameData = useBuildStore((s) => s.gameData);
  const build = useBuildStore((s) => s.build);
  const setRace = useBuildStore((s) => s.setRace);
  const setStandingStone = useBuildStore((s) => s.setStandingStone);
  const setBlessing = useBuildStore((s) => s.setBlessing);
  const toggleTrait = useBuildStore((s) => s.toggleTrait);
  const toggleMajorSkill = useBuildStore((s) => s.toggleMajorSkill);
  const toggleMinorSkill = useBuildStore((s) => s.toggleMinorSkill);
  const setupPicker = useUiStore((s) => s.setupPicker);
  const toggleSetupPicker = useUiStore((s) => s.toggleSetupPicker);

  if (!gameData) return null;

  const { game } = gameData;
  const majorRemaining = game.manifest.limits.majorSkills - build.majorSkillIds.length;
  const minorRemaining = game.manifest.limits.minorSkills - build.minorSkillIds.length;
  const traitsRemaining = game.manifest.limits.traits - build.traitIds.length;
  const noneLabel = labels.noneSelected ?? "None selected";

  const selectedRaceName =
    build.raceId && build.raceId !== "none"
      ? (game.races.find((r) => r.id === build.raceId)?.name ?? build.raceId)
      : null;
  const selectedStoneName =
    build.standingStoneId && build.standingStoneId !== "none"
      ? (game.standingStones.find((s) => s.id === build.standingStoneId)?.name ??
        build.standingStoneId)
      : null;
  const selectedBlessingName =
    build.blessingId && build.blessingId !== "none"
      ? (game.blessings.find((b) => b.id === build.blessingId)?.name ?? build.blessingId)
      : null;

  const selectedTraitItems = build.traitIds.map((id) => ({
    id,
    label: game.traits.find((t) => t.id === id)?.name ?? id,
  }));
  const selectedMajorItems = build.majorSkillIds.map((id) => ({
    id,
    label: game.skills.find((s) => s.id === id)?.name ?? id,
    icon: true as const,
  }));
  const selectedMinorItems = build.minorSkillIds.map((id) => ({
    id,
    label: game.skills.find((s) => s.id === id)?.name ?? id,
    icon: true as const,
  }));

  return (
    <Card className="flex-shrink-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <SetupPickerRow
            label={labels.race}
            picker="race"
            isActive={setupPicker === "race"}
            onOpen={() => toggleSetupPicker("race")}
            selectedItems={
              selectedRaceName && build.raceId
                ? [{ id: build.raceId, label: selectedRaceName }]
                : []
            }
            onRemove={() => setRace("none")}
            noneLabel={noneLabel}
          />
          <SetupPickerRow
            label={labels.standingStone}
            picker="standing-stone"
            isActive={setupPicker === "standing-stone"}
            onOpen={() => toggleSetupPicker("standing-stone")}
            selectedItems={
              selectedStoneName && build.standingStoneId
                ? [{ id: build.standingStoneId, label: selectedStoneName }]
                : []
            }
            onRemove={() => setStandingStone("none")}
            noneLabel={noneLabel}
          />
          <SetupPickerRow
            label={labels.blessing}
            picker="blessing"
            isActive={setupPicker === "blessing"}
            onOpen={() => toggleSetupPicker("blessing")}
            selectedItems={
              selectedBlessingName && build.blessingId
                ? [{ id: build.blessingId, label: selectedBlessingName }]
                : []
            }
            onRemove={() => setBlessing("none")}
            noneLabel={noneLabel}
          />
        </div>
        <div className="space-y-1.5 border-t border-[var(--color-border)]/70 pt-3">
          <SetupPickerRow
            label={labels.traits}
            remaining={traitsRemaining}
            picker="traits"
            multi
            isActive={setupPicker === "traits"}
            onOpen={() => toggleSetupPicker("traits")}
            selectedItems={selectedTraitItems}
            onRemove={(index) => toggleTrait(build.traitIds[index])}
            noneLabel={noneLabel}
          />
          <SetupPickerRow
            label={labels.majorSkills}
            remaining={majorRemaining}
            picker="major-skills"
            multi
            isActive={setupPicker === "major-skills"}
            onOpen={() => toggleSetupPicker("major-skills")}
            selectedItems={selectedMajorItems}
            onRemove={(index) => toggleMajorSkill(build.majorSkillIds[index])}
            noneLabel={noneLabel}
          />
          <SetupPickerRow
            label={labels.minorSkills}
            remaining={minorRemaining}
            picker="minor-skills"
            multi
            isActive={setupPicker === "minor-skills"}
            onOpen={() => toggleSetupPicker("minor-skills")}
            selectedItems={selectedMinorItems}
            onRemove={(index) => toggleMinorSkill(build.minorSkillIds[index])}
            noneLabel={noneLabel}
          />
        </div>
      </CardContent>
    </Card>
  );
}
