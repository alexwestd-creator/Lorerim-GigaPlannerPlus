import type { StandingStone } from "@/data/schemas";
import { DetailBulletList, DetailSection } from "@/components/option-details/DetailSection";

interface StandingStoneDetailContentProps {
  stone: StandingStone & { bonusDetails: string[] };
  labels: {
    bonuses: string;
  };
  hideHeader?: boolean;
}

export function StandingStoneDetailContent({
  stone,
  labels,
  hideHeader,
}: StandingStoneDetailContentProps) {
  if (stone.id === "none") return null;

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-accent)]">
            {stone.name}
          </h3>
          {stone.group && (
            <p className="mt-1 text-[10px] italic leading-relaxed text-[var(--color-muted)]">
              {stone.group}
            </p>
          )}
          {stone.description && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              {stone.description}
            </p>
          )}
        </div>
      )}
      {hideHeader && (
        <>
          {stone.group && (
            <p className="text-xs italic leading-relaxed text-[var(--color-muted)]">{stone.group}</p>
          )}
          {stone.description && (
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">{stone.description}</p>
          )}
        </>
      )}

      {stone.bonusDetails.length > 0 && (
        <DetailSection title={labels.bonuses}>
          <DetailBulletList items={stone.bonusDetails} />
        </DetailSection>
      )}
    </div>
  );
}
