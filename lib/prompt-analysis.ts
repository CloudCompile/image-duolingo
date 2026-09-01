import { ModelType, PromptAnalysisCategory, PromptAnalysisResult } from "@/lib/types";

const sharedDictionary: Record<PromptAnalysisCategory, string[]> = {
  subject: ["man", "woman", "girl", "boy", "warrior", "wizard", "character", "knight", "dragon", "robot", "portrait", "solo"],
  appearance: ["hair", "eyes", "jacket", "scarf", "silver", "blue", "red", "black", "armor", "dress", "face"],
  action: ["standing", "running", "looking", "raising", "holding", "walking", "flying", "casting", "posing"],
  environment: ["city", "street", "forest", "mountain", "rooftop", "castle", "rain", "fog", "snow", "night", "sunset", "storm"],
  composition: ["close-up", "portrait", "upper body", "medium shot", "cowboy shot", "full body", "wide shot", "foreground", "background"],
  camera: ["low angle", "high angle", "eye level", "from above", "from below", "profile", "three-quarter", "dutch angle"],
  lighting: ["soft lighting", "hard lighting", "dramatic lighting", "rim lighting", "backlighting", "volumetric", "neon", "golden hour", "moonlight", "studio"],
  style: ["cinematic", "anime", "illustration", "realistic", "painterly", "concept art", "photoreal", "stylized"],
};

const modelDictionary: Record<ModelType, Partial<Record<PromptAnalysisCategory, string[]>>> = {
  SDXL: {
    style: ["cinematic", "highly detailed", "photorealistic", "film still", "moody"],
  },
  Illustrious: {
    subject: ["1girl", "1boy", "solo", "looking_at_viewer"],
    composition: ["cowboy shot", "full body"],
    style: ["masterpiece", "best quality", "anime"],
  },
  Anima: {
    style: ["anime", "illustration", "line art"],
    action: ["dynamic pose", "action scene"],
  },
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const analyzePromptStructure = (prompt: string, model: ModelType): PromptAnalysisResult => {
  const lower = prompt.toLowerCase();
  const words = lower.split(/\s|,/).filter(Boolean);
  const scores = {} as Record<PromptAnalysisCategory, number>;

  (Object.keys(sharedDictionary) as PromptAnalysisCategory[]).forEach((category) => {
    const baseTerms = sharedDictionary[category];
    const modelTerms = modelDictionary[model][category] ?? [];
    const terms = [...new Set([...baseTerms, ...modelTerms])];
    const matched = terms.filter((term) => lower.includes(term));
    const densityBonus = clamp((words.length / 30) * 12, 0, 12);
    scores[category] = clamp(Math.round((matched.length / Math.max(terms.length / 4, 1)) * 100 + densityBonus), 0, 100);
  });

  const feedback: string[] = [];

  if (scores.subject >= 70) feedback.push("✓ Strong subject definition.");
  else feedback.push("⚠ Add a clearer subject (who or what is in frame).");

  if (scores.composition < 60) feedback.push("💡 Consider framing terms like medium shot or full body.");
  if (scores.camera < 60) feedback.push("💡 Add camera perspective cues such as low angle or eye level.");
  if (scores.lighting < 60) feedback.push("💡 Add lighting intent (e.g., dramatic lighting, rim lighting, neon)." );
  if (scores.environment < 60) feedback.push("💡 Add environment/time/weather details to strengthen atmosphere.");

  feedback.push("This is rule-based Prompt Structure Analysis, not model inference.");

  return { scores, feedback };
};
