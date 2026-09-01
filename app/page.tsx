"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Circle,
  Flame,
  FlaskConical,
  Home,
  Lock,
  Target,
  Trophy,
  Upload,
  User,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import { ACHIEVEMENTS } from "@/lib/achievements-data";
import { CHALLENGES, getDailyChallenge } from "@/lib/challenges-data";
import { COURSE_UNITS } from "@/lib/course-data";
import { generateImage } from "@/lib/generation";
import { getDateKey, getLevelBounds, getLevelFromXP, getYesterdayKey } from "@/lib/progression";
import { analyzePromptStructure } from "@/lib/prompt-analysis";
import { createDefaultData, exportData, importData, loadData, saveData } from "@/lib/storage";
import { Lesson, ModelType, PromptAcademyData } from "@/lib/types";
import { Card, Pill, ProgressBar, SectionTitle } from "@/components/ui";

type Tab = "dashboard" | "learn" | "lab" | "challenges" | "progress" | "profile";

const tabs: { id: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "lab", label: "Prompt Lab", icon: FlaskConical },
  { id: "challenges", label: "Challenges", icon: Trophy },
  { id: "progress", label: "Progress", icon: Target },
  { id: "profile", label: "Profile", icon: User },
];

const activityTypes = ["lesson", "quiz", "challenge", "experiment", "unit", "daily"] as const;

const applyTheme = (theme: "dark" | "light" | "system") => {
  const root = document.documentElement;
  const darkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const darkEnabled = theme === "dark" || (theme === "system" && darkPreferred);
  root.classList.toggle("dark", darkEnabled);
};

const App = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<PromptAcademyData | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonStep, setLessonStep] = useState(0);
  const [quizSelection, setQuizSelection] = useState<number | null>(null);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizPerfect, setQuizPerfect] = useState(true);
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, string>>({});
  const [challengeFeedback, setChallengeFeedback] = useState<Record<string, string>>({});
  const [labModel, setLabModel] = useState<ModelType>("SDXL");
  const [labPrompt, setLabPrompt] = useState("A cinematic portrait of a silver-haired warrior in a rainy neon city at night.");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [generationState, setGenerationState] = useState<{ loading: boolean; imageUrl: string; message: string }>({
    loading: false,
    imageUrl: "",
    message: "Demo Mode — connect an OpenAI-compatible API in Prompt Lab settings.",
  });
  const [experimentTitle, setExperimentTitle] = useState("Camera Angle Power Test");
  const [experimentA, setExperimentA] = useState("knight standing in front of a castle, eye level");
  const [experimentB, setExperimentB] = useState("knight standing in front of a castle, low angle");
  const [experimentC, setExperimentC] = useState("knight standing in front of a castle, high angle");
  const [experimentNotes, setExperimentNotes] = useState("");
  const [experimentLearned, setExperimentLearned] = useState("");
  const [importText, setImportText] = useState("");
  const [recentAchievement, setRecentAchievement] = useState<string | null>(null);

  useEffect(() => {
    const initial = loadData();
    const today = getDateKey();
    if (initial.dailyGoal.date !== today) {
      initial.dailyGoal = { ...initial.dailyGoal, date: today, earnedXP: 0 };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(initial);
    applyTheme(initial.settings.theme);
  }, []);

  useEffect(() => {
    if (!data) return;
    saveData(data);
    applyTheme(data.settings.theme);
  }, [data]);

  const analysis = useMemo(() => analyzePromptStructure(labPrompt, labModel), [labPrompt, labModel]);

  if (!data) return null;

  const levelBounds = getLevelBounds(data.progress.level);
  const xpIntoLevel = data.progress.totalXP - levelBounds.currentFloor;
  const xpRange = levelBounds.nextFloor - levelBounds.currentFloor;
  const today = getDateKey();
  const dailyChallenge = getDailyChallenge(today);

  const updateData = (updater: (prev: PromptAcademyData) => PromptAcademyData) => {
    setData((prev) => (prev ? updater(prev) : prev));
  };

  const registerActivity = (draft: PromptAcademyData) => {
    const now = getDateKey();
    if (draft.streak.lastActivityDate === now) return;
    if (draft.streak.lastActivityDate === getYesterdayKey()) {
      draft.streak.currentStreak += 1;
    } else {
      draft.streak.currentStreak = 1;
    }
    draft.streak.lastActivityDate = now;
    draft.streak.longestStreak = Math.max(draft.streak.longestStreak, draft.streak.currentStreak);
    if (!draft.streak.activityHistory.includes(now)) draft.streak.activityHistory.push(now);
  };

  const unlockAchievements = (draft: PromptAcademyData) => {
    const unlocked = ACHIEVEMENTS.filter((achievement) => achievement.condition(draft) && !draft.achievements.includes(achievement.id));
    unlocked.forEach((achievement) => {
      draft.achievements.push(achievement.id);
      setRecentAchievement(achievement.id);
    });
  };

  const awardXP = (draft: PromptAcademyData, amount: number, reason: string) => {
    const now = getDateKey();
    if (draft.dailyGoal.date !== now) {
      draft.dailyGoal.date = now;
      draft.dailyGoal.earnedXP = 0;
    }

    draft.progress.totalXP += amount;
    draft.progress.level = getLevelFromXP(draft.progress.totalXP);
    draft.dailyGoal.earnedXP += amount;
    draft.progress.dailyXPHistory[now] = (draft.progress.dailyXPHistory[now] ?? 0) + amount;
    draft.progress.xpHistory.push({ id: `${now}-${reason}-${draft.progress.xpHistory.length + 1}`, date: now, amount, reason });
    draft.progress.xpHistory = draft.progress.xpHistory.slice(-200);
    registerActivity(draft);
    unlockAchievements(draft);
  };

  const completeLesson = () => {
    if (!activeLesson) return;

    updateData((prev) => {
      const draft = structuredClone(prev);
      if (!draft.progress.completedLessons.includes(activeLesson.id)) {
        draft.progress.completedLessons.push(activeLesson.id);
        awardXP(draft, activeLesson.xpReward, `Lesson: ${activeLesson.title}`);
        if (quizPerfect) awardXP(draft, 15, `Perfect quiz: ${activeLesson.title}`);

        const unit = COURSE_UNITS.find((u) => u.id === activeLesson.unitId);
        if (unit && unit.lessons.every((lesson) => draft.progress.completedLessons.includes(lesson.id))) {
          if (!draft.progress.completedUnits.includes(unit.id)) {
            draft.progress.completedUnits.push(unit.id);
            awardXP(draft, 100, `Unit complete: ${unit.title}`);
          }
        }
      }
      return draft;
    });

    setActiveLesson(null);
    setLessonStep(0);
    setQuizSelection(null);
    setQuizCorrect(null);
    setQuizPerfect(true);
    setSelectedPieces([]);
  };

  const submitChallenge = (id: string, required: string[], reward: number, daily = false) => {
    const answer = (challengeAnswers[id] ?? "").toLowerCase();
    const matched = required.filter((term) => answer.includes(term.toLowerCase()));
    const pass = matched.length >= Math.max(required.length - 1, 1);

    if (!pass) {
      setChallengeFeedback((prev) => ({
        ...prev,
        [id]: `Needs more detail. Include concepts like: ${required.slice(0, 3).join(", ")}.`,
      }));
      return;
    }

    updateData((prev) => {
      const draft = structuredClone(prev);
      if (daily) {
        const completionId = `${today}:${id}`;
        if (!draft.progress.completedDailyChallenges.includes(completionId)) {
          draft.progress.completedDailyChallenges.push(completionId);
          awardXP(draft, reward, `Daily challenge: ${id}`);
        }
      } else if (!draft.progress.completedChallenges.includes(id)) {
        draft.progress.completedChallenges.push(id);
        awardXP(draft, reward, `Challenge: ${id}`);
      }
      return draft;
    });

    setChallengeFeedback((prev) => ({ ...prev, [id]: "Great work — challenge completed and XP awarded." }));
  };

  const saveExperiment = () => {
    if (!experimentTitle.trim()) return;
    const expId = `exp-${today}-${data.experiments.length + 1}`;

    updateData((prev) => {
      const draft = structuredClone(prev);
      draft.experiments.unshift({
        id: expId,
        title: experimentTitle,
        model: labModel,
        prompts: [experimentA, experimentB, experimentC].filter(Boolean),
        notes: experimentNotes,
        learned: experimentLearned,
        createdAt: new Date().toISOString(),
      });

      if (!draft.progress.completedExperiments.includes(expId)) {
        draft.progress.completedExperiments.push(expId);
        awardXP(draft, 10, "Prompt Lab experiment");
      }
      return draft;
    });

    setExperimentNotes("");
    setExperimentLearned("");
  };

  const runGeneration = async () => {
    setGenerationState((prev) => ({ ...prev, loading: true }));
    const response = await generateImage(
      {
        model: labModel,
        prompt: labPrompt,
        negativePrompt,
      },
      data.settings.openAICompatible,
    );

    setGenerationState({
      loading: false,
      imageUrl: response.imageUrl ?? "",
      message: response.error ?? response.metadata,
    });
  };

  const lessonInProgress = activeLesson ? COURSE_UNITS.find((u) => u.id === activeLesson.unitId) : null;

  const renderDashboard = () => {
    const recentDays = Array.from({ length: 21 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (20 - i));
      return d.toISOString().slice(0, 10);
    });

    return (
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-slate-400">Welcome back</p>
              <h1 className="text-2xl font-bold text-white">🧠 Prompt Academy, {data.profile.username}</h1>
              <p className="mt-1 text-sm text-slate-400">Learn → Quiz → Practice → Experiment → Compare → Earn XP</p>
            </div>
            <Pill tone="warning">
              <Flame className="mr-1 h-3 w-3" /> {data.streak.currentStreak} day streak
            </Pill>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <SectionTitle title="⭐ Total XP" subtitle="Level progression" />
            <p className="mb-2 text-3xl font-semibold text-white">{data.progress.totalXP}</p>
            <p className="mb-2 text-sm text-slate-400">Level {data.progress.level}</p>
            <ProgressBar value={xpIntoLevel} max={xpRange} />
            <p className="mt-2 text-xs text-slate-500">{xpIntoLevel}/{xpRange} XP to next level</p>
          </Card>

          <Card>
            <SectionTitle title="🔥 Daily streak" subtitle="Consistency tracker" />
            <p className="text-lg text-white">Current: {data.streak.currentStreak} days</p>
            <p className="text-sm text-slate-400">Longest: {data.streak.longestStreak} days</p>
            <p className="mb-3 text-sm text-slate-400">Last activity: {data.streak.lastActivityDate ?? "None"}</p>
            <div className="grid grid-cols-7 gap-1">
              {recentDays.map((day) => (
                <div key={day} className={`h-4 rounded ${data.streak.activityHistory.includes(day) ? "bg-emerald-400" : "bg-slate-800"}`} />
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Today's Goal" subtitle="Daily XP target" />
            <p className="mb-2 text-sm text-slate-300">
              {data.dailyGoal.earnedXP} / {data.dailyGoal.targetXP} XP
            </p>
            <ProgressBar value={data.dailyGoal.earnedXP} max={data.dailyGoal.targetXP} />
            <p className="mt-2 text-xs text-slate-500">Goal auto-resets daily.</p>
          </Card>
        </div>
      </div>
    );
  };

  const renderLearn = () => (
    <div className="space-y-4">
      <SectionTitle title="Duolingo-style Learning Path" subtitle="Complete lessons to unlock the next nodes." />
      <div className="space-y-4">
        {COURSE_UNITS.map((unit, unitIdx) => {
          const previousComplete = unitIdx === 0 || data.progress.completedUnits.includes(COURSE_UNITS[unitIdx - 1].id);
          const completeCount = unit.lessons.filter((lesson) => data.progress.completedLessons.includes(lesson.id)).length;
          return (
            <Card key={unit.id} className="overflow-hidden">
              <div className={`rounded-xl bg-gradient-to-r p-3 ${unit.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{unit.title}</h3>
                    <p className="text-sm text-white/80">{unit.subtitle}</p>
                  </div>
                  <Pill>{unit.modelFocus}</Pill>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {unit.lessons.map((lesson, lessonIdx) => {
                  const lessonUnlocked = previousComplete && (lessonIdx === 0 || data.progress.completedLessons.includes(unit.lessons[lessonIdx - 1].id));
                  const done = data.progress.completedLessons.includes(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      disabled={!lessonUnlocked}
                      onClick={() => {
                        setActiveLesson(lesson);
                        setLessonStep(0);
                        setQuizSelection(null);
                        setQuizCorrect(null);
                        setQuizPerfect(true);
                        setSelectedPieces([]);
                      }}
                      className={`rounded-xl border p-3 text-left transition ${
                        done
                          ? "border-emerald-400/40 bg-emerald-500/10"
                          : lessonUnlocked
                            ? "border-white/10 bg-slate-900 hover:border-cyan-400/40"
                            : "cursor-not-allowed border-white/5 bg-slate-950/80 opacity-70"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-sm">
                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : lessonUnlocked ? <Circle className="h-4 w-4 text-slate-400" /> : <Lock className="h-4 w-4 text-slate-500" />}
                        <span className="text-slate-300">Lesson {lessonIdx + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-white">{lesson.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{lesson.description}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-500">Progress: {completeCount}/{unit.lessons.length} lessons</p>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderPromptLab = () => {
    const suggestions = ["low angle", "dramatic lighting", "full body", "rain", "neon reflections", "three-quarter view"];
    const tokenEstimate = Math.ceil(labPrompt.length / 4);

    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Prompt Lab" subtitle="Model-specific experimentation playground" />
          <div className="space-y-3">
            <label className="text-sm text-slate-300">Model</label>
            <select value={labModel} onChange={(e) => setLabModel(e.target.value as ModelType)} className="w-full rounded-xl border border-white/10 bg-slate-950 p-2 text-sm text-white">
              <option>SDXL</option>
              <option>Illustrious</option>
              <option>Anima</option>
            </select>

            <div>
              <label className="text-sm text-slate-300">Prompt</label>
              <textarea
                value={labPrompt}
                onChange={(e) => setLabPrompt(e.target.value)}
                rows={6}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-slate-100"
              />
              <p className="mt-1 text-xs text-slate-500">{labPrompt.length} chars • ~{tokenEstimate} tokens (estimate)</p>
            </div>

            <div>
              <label className="text-sm text-slate-300">Negative prompt</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-slate-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button key={item} className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300" onClick={() => setLabPrompt((prev) => `${prev}, ${item}`)}>
                  + {item}
                </button>
              ))}
            </div>

            <Card className="bg-slate-950/70">
              <p className="mb-2 text-sm font-medium text-white">OpenAI-compatible API configuration</p>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="text-xs text-slate-400">
                  Endpoint
                  <input
                    value={data.settings.openAICompatible.endpoint}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          openAICompatible: { ...prev.settings.openAICompatible, endpoint: e.target.value },
                        },
                      }))
                    }
                    placeholder="https://api.openai.com/v1"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  API Key
                  <input
                    type="password"
                    value={data.settings.openAICompatible.apiKey}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          openAICompatible: { ...prev.settings.openAICompatible, apiKey: e.target.value },
                        },
                      }))
                    }
                    placeholder="sk-..."
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Provider Model
                  <input
                    value={data.settings.openAICompatible.model}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          openAICompatible: { ...prev.settings.openAICompatible, model: e.target.value },
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Image Size
                  <select
                    value={data.settings.openAICompatible.imageSize}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          openAICompatible: { ...prev.settings.openAICompatible, imageSize: e.target.value },
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-slate-100"
                  >
                    <option value="1024x1024">1024x1024</option>
                    <option value="1536x1024">1536x1024</option>
                    <option value="1024x1536">1024x1536</option>
                  </select>
                </label>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={data.settings.openAICompatible.enabled}
                  onChange={(e) =>
                    updateData((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        openAICompatible: { ...prev.settings.openAICompatible, enabled: e.target.checked },
                      },
                    }))
                  }
                />
                Enable real generation (otherwise Demo Mode)
              </label>
            </Card>

            <button onClick={runGeneration} className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 font-medium text-white">
              {generationState.loading ? "Generating..." : "Generate / Compare"}
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Generation Preview" subtitle="Demo output if provider not connected" />
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-950 p-3">
              {generationState.imageUrl ? (
                <Image src={generationState.imageUrl} alt="Generated" width={1024} height={1024} className="max-h-96 w-auto rounded-xl object-contain" unoptimized />
              ) : (
                <div className="text-center">
                  <WandSparkles className="mx-auto mb-2 h-6 w-6 text-cyan-300" />
                  <p className="text-sm text-slate-300">Demo Mode Placeholder</p>
                  <p className="text-xs text-slate-500">Connect an image generation provider to generate real images.</p>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">{generationState.message}</p>
          </Card>

          <Card>
            <SectionTitle title="Prompt Structure Analysis" subtitle="Rule-based heuristic feedback" />
            <div className="space-y-2">
              {Object.entries(analysis.scores).map(([k, v]) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span className="capitalize">{k}</span>
                    <span>{v}%</span>
                  </div>
                  <ProgressBar value={v} />
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-300">
              {analysis.feedback.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle title="Prompt Experiments" subtitle="Save A/B/C tests and learnings" />
            <div className="space-y-2 text-sm">
              <input value={experimentTitle} onChange={(e) => setExperimentTitle(e.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 p-2" />
              <textarea value={experimentA} onChange={(e) => setExperimentA(e.target.value)} rows={2} className="w-full rounded-lg border border-white/10 bg-slate-950 p-2" />
              <textarea value={experimentB} onChange={(e) => setExperimentB(e.target.value)} rows={2} className="w-full rounded-lg border border-white/10 bg-slate-950 p-2" />
              <textarea value={experimentC} onChange={(e) => setExperimentC(e.target.value)} rows={2} className="w-full rounded-lg border border-white/10 bg-slate-950 p-2" />
              <textarea value={experimentNotes} onChange={(e) => setExperimentNotes(e.target.value)} placeholder="Notes" rows={2} className="w-full rounded-lg border border-white/10 bg-slate-950 p-2" />
              <textarea value={experimentLearned} onChange={(e) => setExperimentLearned(e.target.value)} placeholder="What did you learn?" rows={2} className="w-full rounded-lg border border-white/10 bg-slate-950 p-2" />
              <button onClick={saveExperiment} className="w-full rounded-xl bg-slate-800 py-2 text-sm text-white">
                Save experiment (+10 XP)
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {data.experiments.slice(0, 4).map((exp) => (
                <div key={exp.id} className="rounded-lg border border-white/10 bg-slate-950 p-2 text-xs text-slate-300">
                  <p className="font-medium text-white">{exp.title}</p>
                  <p>{exp.model} • {new Date(exp.createdAt).toLocaleDateString()}</p>
                  <p className="text-slate-400">{exp.learned || "No learning note yet."}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderChallenges = () => (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="Daily Challenge" subtitle="Deterministic date-based challenge" />
        <p className="text-sm text-slate-200">{dailyChallenge.promptGoal}</p>
        <p className="text-xs text-slate-400">Reward: +{dailyChallenge.xpReward} XP</p>
        <textarea
          rows={3}
          value={challengeAnswers[dailyChallenge.id] ?? ""}
          onChange={(e) => setChallengeAnswers((prev) => ({ ...prev, [dailyChallenge.id]: e.target.value }))}
          className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-sm"
        />
        <button onClick={() => submitChallenge(dailyChallenge.id, dailyChallenge.requiredConcepts, dailyChallenge.xpReward, true)} className="mt-2 rounded-lg bg-fuchsia-600 px-3 py-2 text-sm text-white">
          Submit daily challenge
        </button>
        {challengeFeedback[dailyChallenge.id] ? <p className="mt-2 text-xs text-slate-300">{challengeFeedback[dailyChallenge.id]}</p> : null}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {CHALLENGES.map((challenge) => {
          const done = data.progress.completedChallenges.includes(challenge.id);
          return (
            <Card key={challenge.id}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{challenge.title}</h3>
                <Pill tone={done ? "success" : "default"}>{challenge.difficulty}</Pill>
              </div>
              <p className="text-sm text-slate-300">{challenge.promptGoal}</p>
              <p className="mt-1 text-xs text-slate-500">Need: {challenge.requiredConcepts.join(", ")}</p>
              <textarea
                rows={3}
                value={challengeAnswers[challenge.id] ?? ""}
                onChange={(e) => setChallengeAnswers((prev) => ({ ...prev, [challenge.id]: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-sm"
              />
              <button disabled={done} onClick={() => submitChallenge(challenge.id, challenge.requiredConcepts, challenge.xpReward)} className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50">
                {done ? "Completed" : `Submit (+${challenge.xpReward} XP)`}
              </button>
              {challengeFeedback[challenge.id] ? <p className="mt-2 text-xs text-slate-300">{challengeFeedback[challenge.id]}</p> : null}
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-4">
      <SectionTitle title="Progress Dashboard" subtitle="Track your growth across all systems" />
      <div className="grid gap-3 md:grid-cols-3">
        <Card><p className="text-xs text-slate-400">Current level</p><p className="text-2xl text-white">{data.progress.level}</p></Card>
        <Card><p className="text-xs text-slate-400">Lessons completed</p><p className="text-2xl text-white">{data.progress.completedLessons.length}</p></Card>
        <Card><p className="text-xs text-slate-400">Experiments</p><p className="text-2xl text-white">{data.progress.completedExperiments.length}</p></Card>
      </div>

      <Card>
        <SectionTitle title="Unit Completion" />
        <div className="space-y-3">
          {COURSE_UNITS.map((unit) => {
            const completed = unit.lessons.filter((lesson) => data.progress.completedLessons.includes(lesson.id)).length;
            return (
              <div key={unit.id}>
                <div className="mb-1 flex justify-between text-sm text-slate-300">
                  <span>{unit.title}</span>
                  <span>{completed}/{unit.lessons.length}</span>
                </div>
                <ProgressBar value={completed} max={unit.lessons.length} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Achievements" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = data.achievements.includes(achievement.id);
            return (
              <div key={achievement.id} className={`rounded-xl border p-3 ${unlocked ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-slate-950"}`}>
                <p className="text-lg">{achievement.icon}</p>
                <p className="text-sm font-semibold text-white">{achievement.title}</p>
                <p className="text-xs text-slate-400">{achievement.description}</p>
                <p className="mt-1 text-[11px] text-slate-500">{unlocked ? "Unlocked" : "Locked"}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="Profile Settings" />
        <label className="text-sm text-slate-300">Username</label>
        <input
          value={data.profile.username}
          onChange={(e) => updateData((prev) => ({ ...prev, profile: { ...prev.profile, username: e.target.value } }))}
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 p-2"
        />
      </Card>

      <Card>
        <SectionTitle title="Learning Settings" />
        <label className="text-sm text-slate-300">Daily XP Goal</label>
        <select
          value={data.dailyGoal.targetXP}
          onChange={(e) => updateData((prev) => ({ ...prev, dailyGoal: { ...prev.dailyGoal, targetXP: Number(e.target.value) } }))}
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 p-2"
        >
          <option value={10}>Casual (10 XP)</option>
          <option value={25}>Regular (25 XP)</option>
          <option value={50}>Serious (50 XP)</option>
          <option value={100}>Intense (100 XP)</option>
        </select>
      </Card>

      <Card>
        <SectionTitle title="Appearance" />
        <div className="grid gap-2 sm:grid-cols-3">
          {(["dark", "light", "system"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateData((prev) => ({ ...prev, settings: { ...prev.settings, theme: mode } }))}
              className={`rounded-lg border p-2 text-sm capitalize ${data.settings.theme === mode ? "border-cyan-400 bg-cyan-500/10" : "border-white/10"}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Data Management" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const blob = new Blob([exportData(data)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `prompt-academy-${getDateKey()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm"
          >
            Export JSON
          </button>
          <button
            onClick={() => {
              if (!importText.trim()) return;
              try {
                const imported = importData(importText);
                setData(imported);
                setImportText("");
              } catch {
                alert("Invalid JSON.");
              }
            }}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm"
          >
            <Upload className="mr-1 inline h-4 w-4" /> Import JSON
          </button>
          <button
            onClick={() => {
              if (window.confirm("Reset all Prompt Academy progress? This cannot be undone.")) {
                setData(createDefaultData());
              }
            }}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm"
          >
            Reset Progress
          </button>
        </div>
        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={4} placeholder="Paste exported JSON to import" className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-sm" />
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2a56_0%,#05070f_50%,#04050a_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-3 pb-24 pt-4 md:px-6 md:pb-8">
        <Card className="mb-4 flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-300" />
            <div>
              <p className="text-sm font-semibold text-white">Prompt Academy</p>
              <p className="text-[11px] text-slate-400">Duolingo-style AI image prompting mastery</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`rounded-xl px-3 py-2 text-sm ${tab === item.id ? "bg-cyan-500/15 text-cyan-200" : "text-slate-300 hover:bg-white/5"}`}
                >
                  <Icon className="mr-1 inline h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </div>
        </Card>

        {tab === "dashboard" && renderDashboard()}
        {tab === "learn" && renderLearn()}
        {tab === "lab" && renderPromptLab()}
        {tab === "challenges" && renderChallenges()}
        {tab === "progress" && renderProgress()}
        {tab === "profile" && renderProfile()}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/90 p-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-lg p-2 text-[10px] ${tab === item.id ? "bg-cyan-500/15 text-cyan-200" : "text-slate-400"}`}>
                <Icon className="mx-auto mb-1 h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {activeLesson && lessonInProgress ? (
          <motion.div className="fixed inset-0 z-40 flex items-end bg-black/60 p-0 md:items-center md:justify-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-900 p-4 md:max-w-3xl md:rounded-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">{lessonInProgress.title}</p>
                  <h3 className="text-lg font-semibold text-white">{activeLesson.title}</h3>
                </div>
                <button className="text-sm text-slate-400" onClick={() => setActiveLesson(null)}>
                  Close
                </button>
              </div>

              {lessonStep < activeLesson.sections.length ? (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-cyan-300">{activityTypes[Math.min(lessonStep, activityTypes.length - 1)]}</p>
                  <h4 className="text-base font-semibold text-white">{activeLesson.sections[lessonStep].title}</h4>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{activeLesson.sections[lessonStep].content}</p>
                  <button onClick={() => setLessonStep((s) => s + 1)} className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white">
                    Continue
                  </button>
                </div>
              ) : lessonStep === activeLesson.sections.length ? (
                <div>
                  <h4 className="text-base font-semibold text-white">Quiz</h4>
                  <p className="mt-1 text-sm text-slate-300">{activeLesson.quiz.prompt}</p>
                  <div className="mt-3 space-y-2">
                    {activeLesson.quiz.options.map((option, idx) => (
                      <button
                        key={option}
                        onClick={() => {
                          setQuizSelection(idx);
                          const correct = idx === activeLesson.quiz.answerIndex;
                          setQuizCorrect(correct);
                          if (!correct) setQuizPerfect(false);
                        }}
                        className={`w-full rounded-lg border p-2 text-left text-sm ${quizSelection === idx ? "border-cyan-400 bg-cyan-500/10" : "border-white/10"}`}
                      >
                        {String.fromCharCode(65 + idx)}. {option}
                      </button>
                    ))}
                  </div>

                  {quizCorrect !== null ? (
                    <Card className="mt-3 bg-slate-950/80">
                      <p className="text-sm text-white">{quizCorrect ? "✓ Correct!" : "✗ Not quite."}</p>
                      <p className="text-xs text-slate-400">{activeLesson.quiz.explanation}</p>
                    </Card>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setQuizSelection(null)} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                      Retry
                    </button>
                    <button onClick={() => setLessonStep((s) => s + 1)} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white">
                      Continue
                    </button>
                  </div>
                </div>
              ) : lessonStep === activeLesson.sections.length + 1 ? (
                <div>
                  <h4 className="text-base font-semibold text-white">Interactive Prompt Builder</h4>
                  <p className="mt-1 text-sm text-slate-300">Goal: {activeLesson.promptBuilder.goal}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeLesson.promptBuilder.pieces.map((piece) => {
                      const chosen = selectedPieces.includes(piece);
                      return (
                        <button
                          key={piece}
                          onClick={() => setSelectedPieces((prev) => (prev.includes(piece) ? prev.filter((p) => p !== piece) : [...prev, piece]))}
                          className={`rounded-full border px-3 py-1 text-xs ${chosen ? "border-emerald-400 bg-emerald-500/15" : "border-white/10"}`}
                        >
                          [{piece}]
                        </button>
                      );
                    })}
                  </div>
                  <Card className="mt-3 bg-slate-950/80">
                    <p className="text-xs text-slate-400">{activeLesson.promptBuilder.explanation}</p>
                    <p className="mt-1 text-sm text-white">Prompt draft: {selectedPieces.join(", ") || "(select pieces)"}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Match score: {
                        activeLesson.promptBuilder.recommendedPieces.filter((p) => selectedPieces.includes(p)).length
                      }/{activeLesson.promptBuilder.recommendedPieces.length}
                    </p>
                  </Card>
                  <button onClick={() => setLessonStep((s) => s + 1)} className="mt-3 rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white">
                    Continue
                  </button>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-semibold text-white">Lesson complete</h4>
                  <p className="mt-1 text-sm text-slate-300">Finish to earn +20 XP{quizPerfect ? " and +15 perfect quiz bonus" : ""}.</p>
                  <button onClick={completeLesson} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
                    Complete lesson
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {recentAchievement ? (
          <motion.div className="fixed right-4 top-4 z-50" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <Card className="border-emerald-400/40 bg-emerald-500/10">
              <p className="text-xs text-emerald-300">Achievement unlocked</p>
              <p className="text-sm font-semibold text-white">{ACHIEVEMENTS.find((a) => a.id === recentAchievement)?.title}</p>
              <button className="mt-1 text-xs text-slate-300" onClick={() => setRecentAchievement(null)}>
                Dismiss
              </button>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default App;
