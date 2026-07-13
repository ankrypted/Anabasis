import { Difficulty, ProgressUpdateResult, UserProgress } from './models';

const BASE_XP = 20;
const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

function toDateOnly(isoDate: string): string {
  return new Date(isoDate).toISOString().slice(0, 10);
}

export function getXpForQuest(difficulty: Difficulty): number {
  return Math.round(BASE_XP * DIFFICULTY_MULTIPLIER[difficulty]);
}

export function getStreakBonus(streakDay: number): number {
  return Math.min(streakDay * 5, 50);
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  let threshold = 100;
  let remaining = Math.max(0, xp);

  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = 100 * level;
  }

  return level;
}

export function getXpIntoLevel(totalXp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  const clamped = Math.max(0, totalXp);
  let level = 1;
  let threshold = 100;
  let remaining = clamped;

  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = 100 * level;
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: threshold,
  };
}

export function updateProgressOnCompletion(progress: UserProgress, difficulty: Difficulty, completedAt: string): ProgressUpdateResult {
  const completionDate = toDateOnly(completedAt);
  const lastDate = progress.lastCompletionDate;

  let streak = progress.currentStreak;
  if (!lastDate) {
    streak = 1;
  } else {
    const last = new Date(lastDate + 'T00:00:00Z').getTime();
    const current = new Date(completionDate + 'T00:00:00Z').getTime();
    const dayDiff = Math.round((current - last) / (24 * 60 * 60 * 1000));

    if (dayDiff <= 0) {
      streak = progress.currentStreak;
    } else if (dayDiff === 1) {
      streak = progress.currentStreak + 1;
    } else {
      streak = 1;
    }
  }

  const gainedXp = getXpForQuest(difficulty) + getStreakBonus(streak);
  const nextTotalXp = Math.max(0, progress.totalXp + gainedXp);
  const nextLevel = getLevelFromXp(nextTotalXp);

  return {
    gainedXp,
    leveledUp: nextLevel > progress.level,
    leveledDown: nextLevel < progress.level,
    progress: {
      totalXp: nextTotalXp,
      level: nextLevel,
      currentStreak: streak,
      lastCompletionDate: completionDate,
    },
  };
}
