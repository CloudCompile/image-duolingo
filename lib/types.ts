export type ModelType = "SDXL" | "Illustrious" | "Anima";

export type LessonSection = {
  id: string;
  title: string;
  content: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type PromptBuilderExercise = {
  goal: string;
  pieces: string[];
  recommendedPieces: string[];
  explanation: string;
};

export type Lesson = {
  id: string;
  unitId: string;
  title: string;
  description: string;
  xpReward: number;
  sections: LessonSection[];
  quiz: QuizQuestion;
  practicePrompt: string;
  promptBuilder: PromptBuilderExercise;
};

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  modelFocus: "General" | ModelType;
  lessons: Lesson[];
};

export type Challenge = {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Daily";
  promptGoal: string;
  requiredConcepts: string[];
  hint: string;
  xpReward: number;
};

export type PromptAnalysisCategory =
  | "subject"
  | "appearance"
  | "action"
  | "environment"
  | "composition"
  | "camera"
  | "lighting"
  | "style";

export type PromptAnalysisResult = {
  scores: Record<PromptAnalysisCategory, number>;
  feedback: string[];
};

export type Achievement = {
  id: string;
  title: string;
  icon: string;
  description: string;
  condition: (data: PromptAcademyData) => boolean;
};

export type ExperimentEntry = {
  id: string;
  title: string;
  model: ModelType;
  prompts: string[];
  notes: string;
  learned: string;
  createdAt: string;
};

export type XPEvent = {
  id: string;
  date: string;
  amount: number;
  reason: string;
};

export type OpenAICompatibleSettings = {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  model: string;
  imageSize: string;
};

export type PromptAcademyData = {
  version: number;
  profile: {
    username: string;
    createdAt: string;
  };
  progress: {
    totalXP: number;
    level: number;
    completedLessons: string[];
    completedUnits: string[];
    completedChallenges: string[];
    completedDailyChallenges: string[];
    completedExperiments: string[];
    xpHistory: XPEvent[];
    dailyXPHistory: Record<string, number>;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    activityHistory: string[];
  };
  dailyGoal: {
    targetXP: number;
    date: string;
    earnedXP: number;
  };
  achievements: string[];
  experiments: ExperimentEntry[];
  settings: {
    theme: "dark" | "light" | "system";
    openAICompatible: OpenAICompatibleSettings;
  };
};
