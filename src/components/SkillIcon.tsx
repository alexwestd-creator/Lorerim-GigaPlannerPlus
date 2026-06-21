import type { LucideIcon } from "lucide-react";
import {
  Compass,
  Crosshair,
  EyeOff,
  Flame,
  FlaskConical,
  Gem,
  Hammer,
  HeartPulse,
  HelpCircle,
  Layers,
  MessagesSquare,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sword,
  Swords,
  Tags,
  Users,
  Wind,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SKILL_ICONS: Record<string, LucideIcon> = {
  smithing: Hammer,
  "heavy-armor": Shield,
  block: ShieldCheck,
  "two-handed": Swords,
  "one-handed": Sword,
  marksman: Crosshair,
  evasion: Wind,
  sneak: EyeOff,
  wayfarer: Compass,
  finesse: Zap,
  speech: MessagesSquare,
  alchemy: FlaskConical,
  illusion: Sparkles,
  conjuration: Users,
  destruction: Flame,
  restoration: HeartPulse,
  alteration: Layers,
  enchanting: Gem,
  destiny: Star,
  traits: Tags,
};

export function getSkillIcon(skillId: string): LucideIcon {
  return SKILL_ICONS[skillId] ?? HelpCircle;
}

interface SkillIconProps {
  skillId: string;
  className?: string;
}

export function SkillIcon({ skillId, className }: SkillIconProps) {
  const Icon = getSkillIcon(skillId);
  return <Icon className={cn("shrink-0", className)} aria-hidden />;
}
