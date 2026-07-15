import { Injectable, computed, signal } from '@angular/core';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Recurrence = 'none' | 'daily' | 'weekly';

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  deadline: string | null;
  recurrence: Recurrence;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface QuestInput {
  title: string;
  description: string;
  difficulty: Difficulty;
  deadline: string | null;
  recurrence: Recurrence;
}

const XP_BY_DIFFICULTY: Record<Difficulty, number> = { easy: 10, medium: 25, hard: 50 };
const XP_PER_LEVEL = 100;

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isNextCalendarDay(prev: Date, curr: Date): boolean {
  const next = new Date(prev);
  next.setDate(next.getDate() + 1);
  return isSameDay(next, curr);
}

let nextId = 1;

function seedQuest(input: QuestInput): Quest {
  return {
    id: String(nextId++),
    ...input,
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
}

@Injectable({ providedIn: 'root' })
export class QuestService {
  readonly quests = signal<Quest[]>([
    seedQuest({
      title: 'Finish onboarding checklist',
      description: 'Set up your profile and create your first quest.',
      difficulty: 'easy',
      deadline: null,
      recurrence: 'none',
    }),
    seedQuest({
      title: 'Ship the Anabasis dashboard',
      description: 'Wire up quests, XP, and streaks end to end.',
      difficulty: 'hard',
      deadline: null,
      recurrence: 'none',
    }),
  ]);

  readonly totalXp = signal(0);
  readonly currentStreak = signal(0);
  readonly longestStreak = signal(0);
  private lastCompletionDate: Date | null = null;

  readonly activeQuests = computed(() => this.quests().filter((q) => !q.completed));
  readonly completedQuests = computed(() =>
    this.quests()
      .filter((q) => q.completed)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  );

  readonly level = computed(() => Math.floor(this.totalXp() / XP_PER_LEVEL) + 1);
  readonly xpIntoLevel = computed(() => this.totalXp() % XP_PER_LEVEL);
  readonly xpToNextLevel = computed(() => XP_PER_LEVEL - this.xpIntoLevel());
  readonly levelProgressPercent = computed(() => Math.round((this.xpIntoLevel() / XP_PER_LEVEL) * 100));

  xpFor(difficulty: Difficulty): number {
    return XP_BY_DIFFICULTY[difficulty];
  }

  addQuest(input: QuestInput): void {
    if (!input.title.trim()) return;
    this.quests.update((list) => [
      ...list,
      seedQuest({ ...input, title: input.title.trim(), description: input.description.trim() }),
    ]);
  }

  deleteQuest(id: string): void {
    this.quests.update((list) => list.filter((q) => q.id !== id));
  }

  completeQuest(id: string): void {
    const target = this.quests().find((q) => q.id === id);
    if (!target || target.completed) return; // already completed: never award XP twice

    const now = new Date();
    const completedAt = now.toISOString();

    this.quests.update((list) =>
      list.map((q) => (q.id === id ? { ...q, completed: true, completedAt } : q))
    );

    this.totalXp.update((xp) => xp + XP_BY_DIFFICULTY[target.difficulty]);
    this.applyStreak(now);

    if (target.recurrence !== 'none') {
      this.spawnRecurringQuest(target);
    }
  }

  private applyStreak(now: Date): void {
    if (!this.lastCompletionDate) {
      this.currentStreak.set(1);
    } else if (isSameDay(this.lastCompletionDate, now)) {
      // another completion on the same day keeps the streak as-is
    } else if (isNextCalendarDay(this.lastCompletionDate, now)) {
      this.currentStreak.update((s) => s + 1);
    } else {
      this.currentStreak.set(1);
    }
    this.lastCompletionDate = now;
    this.longestStreak.update((longest) => Math.max(longest, this.currentStreak()));
  }

  private spawnRecurringQuest(source: Quest): void {
    const deadline = source.deadline ? this.advanceDate(source.deadline, source.recurrence) : null;
    this.quests.update((list) => [
      ...list,
      seedQuest({
        title: source.title,
        description: source.description,
        difficulty: source.difficulty,
        deadline,
        recurrence: source.recurrence,
      }),
    ]);
  }

  private advanceDate(iso: string, recurrence: Recurrence): string {
    const date = new Date(iso);
    date.setDate(date.getDate() + (recurrence === 'weekly' ? 7 : 1));
    return date.toISOString().slice(0, 10);
  }
}
