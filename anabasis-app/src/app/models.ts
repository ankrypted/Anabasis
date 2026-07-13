export type Difficulty = 'easy' | 'medium' | 'hard';

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
}

export type RecurrenceType = 'daily' | 'weekdays' | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  daysOfWeek: number[];
}

export interface QuestTemplate {
  id: string;
  userId: string;
  title: string;
  difficulty: Difficulty;
  recurrence: Recurrence;
  createdAt: string;
  archived: boolean;
}

export interface QuestInstance {
  id: string;
  templateId: string;
  userId: string;
  title: string;
  difficulty: Difficulty;
  questDate: string;
  completedAt?: string;
  completionKey?: string;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  currentStreak: number;
  lastCompletionDate?: string;
}

export interface ProgressUpdateResult {
  gainedXp: number;
  leveledUp: boolean;
  leveledDown: boolean;
  progress: UserProgress;
}
