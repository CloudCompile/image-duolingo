import { getDateKey } from "@/lib/progression";
import { PromptAcademyData } from "@/lib/types";

const STORAGE_KEY = "promptAcademyData";
const SCHEMA_VERSION = 1;

const defaultOpenAIConfig = {
  enabled: false,
  endpoint: "",
  apiKey: "",
  model: "gpt-image-1",
  imageSize: "1024x1024",
};

export const createDefaultData = (): PromptAcademyData => ({
  version: SCHEMA_VERSION,
  profile: {
    username: "Learner",
    createdAt: new Date().toISOString(),
  },
  progress: {
    totalXP: 0,
    level: 1,
    completedLessons: [],
    completedUnits: [],
    completedChallenges: [],
    completedDailyChallenges: [],
    completedExperiments: [],
    xpHistory: [],
    dailyXPHistory: {},
  },
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    activityHistory: [],
  },
  dailyGoal: {
    targetXP: 50,
    date: getDateKey(),
    earnedXP: 0,
  },
  achievements: [],
  experiments: [],
  settings: {
    theme: "dark",
    openAICompatible: defaultOpenAIConfig,
  },
});

const migrate = (raw: Partial<PromptAcademyData>): PromptAcademyData => {
  const base = createDefaultData();

  return {
    ...base,
    ...raw,
    version: SCHEMA_VERSION,
    profile: {
      ...base.profile,
      ...(raw.profile ?? {}),
    },
    progress: {
      ...base.progress,
      ...(raw.progress ?? {}),
      completedLessons: raw.progress?.completedLessons ?? [],
      completedUnits: raw.progress?.completedUnits ?? [],
      completedChallenges: raw.progress?.completedChallenges ?? [],
      completedDailyChallenges: raw.progress?.completedDailyChallenges ?? [],
      completedExperiments: raw.progress?.completedExperiments ?? [],
      xpHistory: raw.progress?.xpHistory ?? [],
      dailyXPHistory: raw.progress?.dailyXPHistory ?? {},
    },
    streak: {
      ...base.streak,
      ...(raw.streak ?? {}),
      activityHistory: raw.streak?.activityHistory ?? [],
    },
    dailyGoal: {
      ...base.dailyGoal,
      ...(raw.dailyGoal ?? {}),
    },
    achievements: raw.achievements ?? [],
    experiments: raw.experiments ?? [],
    settings: {
      ...base.settings,
      ...(raw.settings ?? {}),
      openAICompatible: {
        ...base.settings.openAICompatible,
        ...(raw.settings?.openAICompatible ?? {}),
      },
    },
  };
};

export const loadData = (): PromptAcademyData => {
  if (typeof window === "undefined") return createDefaultData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<PromptAcademyData>;
    const migrated = migrate(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    const fallback = createDefaultData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

export const saveData = (data: PromptAcademyData) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const exportData = (data: PromptAcademyData) => JSON.stringify(data, null, 2);

export const importData = (value: string): PromptAcademyData => {
  const parsed = JSON.parse(value) as Partial<PromptAcademyData>;
  return migrate(parsed);
};
