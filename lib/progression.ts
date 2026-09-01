const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500, 8200, 10000];

export const getLevelFromXP = (xp: number) => {
  const level = LEVEL_THRESHOLDS.findLastIndex((threshold) => xp >= threshold) + 1;
  return Math.max(level, 1);
};

export const getLevelBounds = (level: number) => {
  const currentFloor = LEVEL_THRESHOLDS[Math.max(level - 1, 0)] ?? 0;
  const nextFloor = LEVEL_THRESHOLDS[level] ?? currentFloor + 2000;
  return { currentFloor, nextFloor };
};

export const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

export const getYesterdayKey = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getDateKey(d);
};

export const isSameDay = (a: string | null, b: string) => a === b;
