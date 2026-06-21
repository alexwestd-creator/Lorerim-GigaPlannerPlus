export function parseBonusBullets(text: string): string[] {
  return text
    .split(" • ")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatRegenPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
