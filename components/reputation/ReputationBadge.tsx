import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { REPUTATION_LEVELS } from "@/services/ReputationService";
import { Star, BadgeCheck, Award, Trophy, Zap } from "lucide-react";

interface ReputationBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function ReputationBadge({
  level,
  size = "md",
  showTooltip = true,
}: ReputationBadgeProps) {
  // Find the level details
  const levelDetails =
    REPUTATION_LEVELS.find((l) => l.name === level) || REPUTATION_LEVELS[0];

  // Size maps for the badge and icon
  const sizeMap = {
    sm: {
      badge: "px-2 py-0 text-xs",
      icon: "h-3 w-3 mr-1",
    },
    md: {
      badge: "px-2.5 py-0.5 text-xs",
      icon: "h-3.5 w-3.5 mr-1.5",
    },
    lg: {
      badge: "px-3 py-1 text-sm",
      icon: "h-4 w-4 mr-2",
    },
  };

  // Icon mapping
  const IconComponent = () => {
    switch (levelDetails.icon) {
      case "StarIcon":
        return <Star className={sizeMap[size].icon} />;
      case "BadgeIcon":
        return <BadgeCheck className={sizeMap[size].icon} />;
      case "AwardIcon":
        return <Award className={sizeMap[size].icon} />;
      case "TrophyIcon":
        return <Trophy className={sizeMap[size].icon} />;
      case "ZapIcon":
        return <Zap className={sizeMap[size].icon} />;
      default:
        return <Star className={sizeMap[size].icon} />;
    }
  };

  const badge = (
    <Badge
      className={`${sizeMap[size].badge} inline-flex items-center ${levelDetails.color} text-white`}
      variant="outline"
    >
      <IconComponent />
      {level}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div>
            <p className="font-semibold">{level}</p>
            <p className="text-xs text-muted-foreground">
              {levelDetails.description}
            </p>
            <p className="text-xs mt-1">
              Required points: {levelDetails.threshold}+
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
