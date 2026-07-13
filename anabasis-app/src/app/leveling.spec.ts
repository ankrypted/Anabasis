/// <reference types="jasmine" />

import { getLevelFromXp, getStreakBonus, getXpForQuest, updateProgressOnCompletion } from './leveling';
import { UserProgress } from './models';

describe('leveling utilities', () => {
  it('should apply difficulty multipliers', () => {
    expect(getXpForQuest('easy')).toBe(20);
    expect(getXpForQuest('medium')).toBe(30);
    expect(getXpForQuest('hard')).toBe(40);
  });

  it('should cap streak bonus at 50', () => {
    expect(getStreakBonus(1)).toBe(5);
    expect(getStreakBonus(10)).toBe(50);
    expect(getStreakBonus(20)).toBe(50);
  });

  it('should derive level from cumulative xp thresholds', () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(99)).toBe(1);
    expect(getLevelFromXp(100)).toBe(2);
    expect(getLevelFromXp(299)).toBe(2);
    expect(getLevelFromXp(300)).toBe(3);
  });

  it('should update streak and progress on quest completion', () => {
    const progress: UserProgress = {
      totalXp: 95,
      level: 1,
      currentStreak: 1,
      lastCompletionDate: '2026-07-12',
    };

    const result = updateProgressOnCompletion(progress, 'hard', '2026-07-13T05:30:00.000Z');

    expect(result.gainedXp).toBe(50);
    expect(result.progress.totalXp).toBe(145);
    expect(result.progress.currentStreak).toBe(2);
    expect(result.progress.level).toBe(2);
    expect(result.leveledUp).toBeTrue();
  });
});
