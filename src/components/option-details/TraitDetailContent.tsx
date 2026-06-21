import type { Mechanics, Trait } from "@/data/schemas";
import { DetailBulletList, DetailSection } from "@/components/option-details/DetailSection";
import { formatEffectBonus } from "@/lib/formatEffect";

interface TraitDetailContentProps {
  trait: Trait;
  mechanics: Mechanics;
  labels: {
    bonuses: string;
  };
  hideHeader?: boolean;
}

export function TraitDetailContent({ trait, mechanics, labels, hideHeader }: TraitDetailContentProps) {
  const bonusLines = trait.effects.map((effect) => formatEffectBonus(effect, mechanics));

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-accent)]">
            {trait.name}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">{trait.description}</p>
        </div>
      )}
      {hideHeader && (
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">{trait.description}</p>
      )}

      {bonusLines.length > 0 && (
        <DetailSection title={labels.bonuses}>
          <DetailBulletList items={bonusLines} />
        </DetailSection>
      )}
    </div>
  );
}
