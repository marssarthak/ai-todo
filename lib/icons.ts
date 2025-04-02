import {
  Trophy,
  Award,
  Star,
  BadgeCheck,
  CheckCircle2,
  Calendar,
  Zap,
  Target,
  Sun,
  Moon,
  Sunrise,
  Milestone,
  LucideIcon,
} from "lucide-react";

// Map of icon name strings to Lucide icon components
export const iconMap: Record<string, LucideIcon> = {
  // Achievement icons
  TrophyIcon: Trophy,
  AwardIcon: Award,
  StarIcon: Star,
  BadgeIcon: BadgeCheck,
  CheckCircleIcon: CheckCircle2,
  CalendarIcon: Calendar,
  ZapIcon: Zap,
  TargetIcon: Target,
  SunIcon: Sun,
  MoonIcon: Moon,
  SunriseIcon: Sunrise,
  MilestoneIcon: Milestone,

  // Fallbacks for backward compatibility
  Trophy: Trophy,
  Award: Award,
  Star: Star,
  BadgeCheck: BadgeCheck,
  CheckCircle: CheckCircle2,
  Calendar: Calendar,
  Zap: Zap,
  Target: Target,
  Sun: Sun,
  Moon: Moon,
  Sunrise: Sunrise,
  Milestone: Milestone,
};
