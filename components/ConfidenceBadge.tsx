import React from "react";
import { Badge } from "./Badge";
import type { ConfidenceLevel } from "@/lib/types";

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  style?: React.CSSProperties;
}

export function ConfidenceBadge({ confidence, style }: ConfidenceBadgeProps) {
  const variant = confidence === "high" ? "green" : confidence === "medium" ? "amber" : "red";
  const label = confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low";

  return (
    <Badge variant={variant} style={style}>
      {label}
    </Badge>
  );
}