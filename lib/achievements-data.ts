import { TOTAL_LESSON_COUNT } from "@/lib/course-data";
import { Achievement, PromptAcademyData } from "@/lib/types";

const hasCompletedEveryBeginnerUnit = (data: PromptAcademyData) => {
  const beginnerUnits = ["unit-1", "unit-2", "unit-3"];
  return beginnerUnits.every((unitId) => data.progress.completedUnits.includes(unitId));
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-flame",
    title: "First Flame",
    icon: "🔥",
    description: "Reach a 3-day streak.",
    condition: (data) => data.streak.currentStreak >= 3,
  },
  {
    id: "dedicated",
    title: "Dedicated",
    icon: "🔥",
    description: "Reach a 7-day streak.",
    condition: (data) => data.streak.currentStreak >= 7,
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    icon: "🔥",
    description: "Reach a 30-day streak.",
    condition: (data) => data.streak.currentStreak >= 30,
  },
  {
    id: "rising-star",
    title: "Rising Star",
    icon: "⭐",
    description: "Earn 500 XP.",
    condition: (data) => data.progress.totalXP >= 500,
  },
  {
    id: "prompt-master",
    title: "Prompt Master",
    icon: "⭐",
    description: "Earn 5,000 XP.",
    condition: (data) => data.progress.totalXP >= 5000,
  },
  {
    id: "scientist",
    title: "Scientist",
    icon: "🧪",
    description: "Complete 10 Prompt Lab experiments.",
    condition: (data) => data.progress.completedExperiments.length >= 10,
  },
  {
    id: "artist",
    title: "Artist",
    icon: "🎨",
    description: "Complete every beginner unit.",
    condition: hasCompletedEveryBeginnerUnit,
  },
  {
    id: "completionist",
    title: "Completionist",
    icon: "🏆",
    description: "Complete every lesson.",
    condition: (data: PromptAcademyData) => data.progress.completedLessons.length >= TOTAL_LESSON_COUNT,
  },
];
