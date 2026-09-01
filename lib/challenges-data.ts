import { Challenge } from "@/lib/types";

export const CHALLENGES: Challenge[] = [
  {
    id: "challenge-beginner-character",
    title: "Beginner Character Build",
    difficulty: "Beginner",
    promptGoal: "Create a character with red hair, green eyes, and a leather jacket.",
    requiredConcepts: ["red hair", "green eyes", "leather jacket"],
    hint: "Use concrete attribute terms and keep one clear subject.",
    xpReward: 30,
  },
  {
    id: "challenge-composition-full-body",
    title: "Composition Control",
    difficulty: "Intermediate",
    promptGoal: "Create an image showing full body framing and wide environment context.",
    requiredConcepts: ["full body", "wide shot"],
    hint: "Use framing words explicitly.",
    xpReward: 30,
  },
  {
    id: "challenge-lighting-dramatic",
    title: "Lighting Director",
    difficulty: "Intermediate",
    promptGoal: "Create a scene with dramatic lighting and strong backlighting.",
    requiredConcepts: ["dramatic lighting", "backlighting"],
    hint: "Layer primary and secondary lighting.",
    xpReward: 30,
  },
  {
    id: "challenge-environment-cyberpunk",
    title: "Environment Atmosphere",
    difficulty: "Intermediate",
    promptGoal: "Create a rainy cyberpunk street at night.",
    requiredConcepts: ["rain", "cyberpunk", "night"],
    hint: "Add reflections to boost cinematic quality.",
    xpReward: 30,
  },
  {
    id: "challenge-advanced-wizard",
    title: "Advanced Wizard Scene",
    difficulty: "Advanced",
    promptGoal: "Create a powerful wizard on a mountain during a storm using low angle, action, environment details, and lighting.",
    requiredConcepts: ["wizard", "mountain", "storm", "low angle", "lighting"],
    hint: "Include pose/action words and weather terms.",
    xpReward: 30,
  },
  {
    id: "challenge-illustrious-tag-stack",
    title: "Illustrious Tag Stack",
    difficulty: "Advanced",
    promptGoal: "Write an Illustrious style prompt using character tags, environment tags, and composition tags.",
    requiredConcepts: ["solo", "cityscape", "night", "looking_at_viewer"],
    hint: "Use comma-separated tags for clarity.",
    xpReward: 30,
  },
  {
    id: "challenge-sdxl-cinematic",
    title: "SDXL Narrative Prompt",
    difficulty: "Advanced",
    promptGoal: "Write a cinematic SDXL prompt describing a coherent scene and lighting setup.",
    requiredConcepts: ["cinematic", "neon", "rainy rooftop"],
    hint: "Prefer complete sentence scene description.",
    xpReward: 30,
  },
];

export const DAILY_CHALLENGE_POOL: Challenge[] = [
  {
    id: "daily-neon-rain-angle",
    title: "Daily: Neon Power",
    difficulty: "Daily",
    promptGoal: "Create a cinematic scene using rain, neon lighting, and low angle.",
    requiredConcepts: ["rain", "neon", "low angle"],
    hint: "Add reflections for stronger atmosphere.",
    xpReward: 50,
  },
  {
    id: "daily-hero-silhouette",
    title: "Daily: Hero Silhouette",
    difficulty: "Daily",
    promptGoal: "Create a full-body hero shot with backlighting and dramatic sky.",
    requiredConcepts: ["full body", "backlighting", "dramatic sky"],
    hint: "Use both composition and lighting terms.",
    xpReward: 50,
  },
  {
    id: "daily-depth-city",
    title: "Daily: City Depth",
    difficulty: "Daily",
    promptGoal: "Create a city scene with clear foreground, midground, and background.",
    requiredConcepts: ["foreground", "midground", "background"],
    hint: "Depth words improve composition control.",
    xpReward: 50,
  },
  {
    id: "daily-character-consistency",
    title: "Daily: Character Consistency",
    difficulty: "Daily",
    promptGoal: "Describe a recurring character with fixed hair, eyes, and outfit.",
    requiredConcepts: ["hair", "eyes", "jacket"],
    hint: "Use a stable descriptor stack.",
    xpReward: 50,
  },
  {
    id: "daily-anima-a-b",
    title: "Daily: A/B Experiment",
    difficulty: "Daily",
    promptGoal: "Write Prompt A and Prompt B with one controlled difference.",
    requiredConcepts: ["prompt a", "prompt b", "one change"],
    hint: "Change one thing only.",
    xpReward: 50,
  },
];

export const getDailyChallenge = (date: string) => {
  const numeric = date.replaceAll("-", "").split("").reduce((acc, char) => acc + Number(char), 0);
  return DAILY_CHALLENGE_POOL[numeric % DAILY_CHALLENGE_POOL.length];
};
