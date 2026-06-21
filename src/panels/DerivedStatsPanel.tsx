import { DetailStatRow } from "@/components/option-details/DetailSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePanelLabels } from "@/theme/ThemeProvider";
import { useBuildStore } from "@/store/buildStore";

function formatStatValue(value: number, isPercent: boolean): string {
  if (isPercent) return `${value.toFixed(1)}%`;
  return value.toFixed(0);
}

interface DerivedStatsPanelProps {
  embedded?: boolean;
}

export function DerivedStatsPanel({ embedded = false }: DerivedStatsPanelProps) {
  const labels = usePanelLabels("derived-stats");
  const computed = useBuildStore((s) => s.computed);

  if (!computed) return null;

  const statRows = (
    <div className="divide-y divide-[var(--color-border)]/50 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)]/30">
      <DetailStatRow label="Carry Weight" value={computed.carryWeight} />
      <DetailStatRow label="Unarmed Damage" value={computed.unarmedDamage} />
      {computed.derivedStats.map((stat) => (
        <DetailStatRow
          key={stat.id}
          label={stat.label}
          value={formatStatValue(stat.value, stat.isPercent)}
        />
      ))}
    </div>
  );

  if (embedded) {
    return statRows;
  }

  return (
    <Card className="min-h-0 flex-1">
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent>{statRows}</CardContent>
    </Card>
  );
}
