import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressCircleProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: "sm" | "md" | "lg";
  strokeWidth?: "thin" | "medium" | "thick";
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function ProgressCircle({
  value,
  size = "md",
  strokeWidth = "medium",
  showValue = true,
  valuePrefix = "",
  valueSuffix = "%",
  className,
  ...props
}: ProgressCircleProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  // Size values
  const sizes = {
    sm: 64,
    md: 80,
    lg: 96,
  };

  // Stroke width values
  const strokeWidths = {
    thin: 2,
    medium: 4,
    thick: 6,
  };

  const actualSize = sizes[size];
  const actualStrokeWidth = strokeWidths[strokeWidth];
  const radius = (actualSize - actualStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (normalizedValue / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: actualSize, height: actualSize }}
      {...props}
    >
      <svg
        width={actualSize}
        height={actualSize}
        viewBox={`0 0 ${actualSize} ${actualSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          strokeWidth={actualStrokeWidth}
          className="stroke-muted"
          fill="none"
        />

        {/* Progress circle */}
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          strokeWidth={actualStrokeWidth}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${actualSize / 2} ${actualSize / 2})`}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <span
            className={cn("font-medium", {
              "text-xs": size === "sm",
              "text-sm": size === "md",
              "text-base": size === "lg",
            })}
          >
            {valuePrefix}
            {Math.round(normalizedValue)}
            {valueSuffix}
          </span>
        </div>
      )}
    </div>
  );
}
