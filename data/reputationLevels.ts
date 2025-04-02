import { BadgeCheck, Star, Award, Trophy, Zap } from "lucide-react";

export interface LevelRule {
  level: number;
  name: string;
  description: string;
  minScore: number;
  maxScore?: number;
  icon: string;
  color: string;
}

export const levelRules: LevelRule[] = [
  {
    level: 0,
    name: "Beginner",
    description: "Just starting your productivity journey",
    minScore: 0,
    maxScore: 9,
    icon: "Star",
    color: "text-zinc-500",
  },
  {
    level: 1,
    name: "Intermediate",
    description: "Consistently completing tasks",
    minScore: 10,
    maxScore: 24,
    icon: "Star",
    color: "text-blue-500",
  },
  {
    level: 2,
    name: "Advanced",
    description: "Building strong productivity habits",
    minScore: 25,
    maxScore: 49,
    icon: "BadgeCheck",
    color: "text-green-500",
  },
  {
    level: 3,
    name: "Expert",
    description: "Mastering your productivity",
    minScore: 50,
    maxScore: 99,
    icon: "Award",
    color: "text-purple-500",
  },
  {
    level: 4,
    name: "Master",
    description: "Maximum productivity achievement",
    minScore: 100,
    icon: "Trophy",
    color: "text-yellow-500",
  },
];
