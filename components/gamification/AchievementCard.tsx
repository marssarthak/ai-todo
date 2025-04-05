import React from "react";
import { Award, Lock, Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { iconMap } from "@/lib/icons";
import { Achievement } from "@/services/StreakService";

interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AchievementCard({
  achievement,
  className,
  size = "md",
}: AchievementCardProps) {
  const { name, description, isUnlocked, unlockedAt, category } = achievement;

  // Size-specific styles
  const sizes = {
    sm: {
      container: "max-w-[250px]",
      iconContainer: "h-8 w-8",
      iconSize: "h-4 w-4",
      title: "text-sm",
      description: "text-xs",
    },
    md: {
      container: "max-w-[300px]",
      iconContainer: "h-12 w-12",
      iconSize: "h-6 w-6",
      title: "text-base",
      description: "text-sm",
    },
    lg: {
      container: "max-w-[350px]",
      iconContainer: "h-16 w-16",
      iconSize: "h-8 w-8",
      title: "text-xl",
      description: "text-base",
    },
  };

  // Map the icon string to a component
  const IconComponent = Trophy;

  return (
    <Card
      className={cn(
        sizes[size].container,
        isUnlocked ? "border-primary" : "opacity-75",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div
            className={cn(
              "rounded-full flex items-center justify-center",
              sizes[size].iconContainer,
              isUnlocked
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <IconComponent className={sizes[size].iconSize} />
          </div>

          <div className="flex items-center">
            <Badge
              variant={isUnlocked ? "default" : "outline"}
              className={cn(
                "rounded-full text-xs px-2 py-0",
                isUnlocked
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-muted"
              )}
            >
              {isUnlocked ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Lock className="h-3 w-3 mr-1" />
              )}
              {isUnlocked ? "Unlocked" : "Locked"}
            </Badge>
          </div>
        </div>
        <CardTitle className={cn("mt-3", sizes[size].title)}>{name}</CardTitle>
        <Badge variant="secondary" className="mt-1 text-xs">
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent>
        <CardDescription className={cn(sizes[size].description)}>
          {description}
        </CardDescription>
      </CardContent>
      {isUnlocked && unlockedAt && (
        <CardFooter className="text-xs text-muted-foreground pt-0">
          Unlocked {formatDistanceToNow(unlockedAt, { addSuffix: true })}
        </CardFooter>
      )}
    </Card>
  );
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  showLabel?: boolean;
}

export function AchievementBadge({
  achievement,
  size = "md",
  showTooltip = true,
  showLabel = false,
}: AchievementBadgeProps) {
  const { name, description, isUnlocked } = achievement;

  // Size-specific styles
  const sizes = {
    sm: { container: "h-7 w-7", icon: "h-3.5 w-3.5" },
    md: { container: "h-9 w-9", icon: "h-4.5 w-4.5" },
    lg: { container: "h-12 w-12", icon: "h-6 w-6" },
  };

  // Map the icon string to a component
  const IconComponent = Trophy;

  const badge = (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "rounded-full flex items-center justify-center",
          sizes[size].container,
          isUnlocked
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        <IconComponent className={sizes[size].icon} />
      </div>
      {showLabel && (
        <span className="text-xs mt-1 max-w-20 text-center overflow-hidden text-ellipsis">
          {name}
        </span>
      )}
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <div className="relative group">
      {badge}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity min-w-[150px] z-50">
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground text-[10px] mt-1">
          {description}
        </div>
        <div className="text-[10px] mt-1">
          Status: {isUnlocked ? "Unlocked" : "Locked"}
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-popover"></div>
      </div>
    </div>
  );
}
