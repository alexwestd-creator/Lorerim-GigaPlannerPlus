import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getRemainingAttributePoints } from "@/engine/buildEngine";
import { usePanelLabels } from "@/theme/ThemeProvider";
import { useBuildStore } from "@/store/buildStore";

const ATTRIBUTE_COLORS = {
  health: "var(--color-health)",
  magicka: "var(--color-magicka)",
  stamina: "var(--color-stamina)",
} as const;

export function AttributesPanel() {
  const labels = usePanelLabels("attributes");
  const gameData = useBuildStore((s) => s.gameData);
  const build = useBuildStore((s) => s.build);
  const computed = useBuildStore((s) => s.computed);
  const adjustAttribute = useBuildStore((s) => s.adjustAttribute);

  if (!gameData || !computed) return null;

  const remaining = getRemainingAttributePoints(gameData.game, build);
  const attrs = [
    { key: "health" as const, label: labels.health, value: computed.attributes.health },
    { key: "magicka" as const, label: labels.magicka, value: computed.attributes.magicka },
    { key: "stamina" as const, label: labels.stamina, value: computed.attributes.stamina },
  ];

  return (
    <Card className="flex-shrink-0">
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">
          {labels.remaining}: {remaining}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {attrs.map(({ key, label, value }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label style={{ color: ATTRIBUTE_COLORS[key] }}>{label}</Label>
              <span className="font-mono text-lg font-semibold" style={{ color: ATTRIBUTE_COLORS[key] }}>
                {value}
              </span>
            </div>
            {gameData.game.manifest.limits.initialAttributePoints > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustAttribute(key, -1)}
                  disabled={build.attributeBonus[key] <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center text-sm text-[var(--color-muted)]">
                  +{build.attributeBonus[key]} bonus
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustAttribute(key, 1)}
                  disabled={remaining <= 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
