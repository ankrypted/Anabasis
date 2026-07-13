import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Difficulty, QuestInstance, QuestTemplate, Recurrence, UserProgress } from './models';
import { getXpIntoLevel, updateProgressOnCompletion } from './leveling';

const PROGRESS_PREFIX = 'anabasis_progress_';
const TEMPLATE_PREFIX = 'anabasis_templates_';
const INSTANCE_PREFIX = 'anabasis_instances_';

function randomId(prefix: string): string {
  const raw = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${raw}`;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateOnly(dateOnly: string): Date {
  return new Date(dateOnly + 'T00:00:00Z');
}

@Injectable({ providedIn: 'root' })
export class QuestService {
  private readonly templatesSubject = new BehaviorSubject<QuestTemplate[]>([]);
  readonly templates$ = this.templatesSubject.asObservable();

  private readonly todayQuestsSubject = new BehaviorSubject<QuestInstance[]>([]);
  readonly todayQuests$ = this.todayQuestsSubject.asObservable();

  private readonly progressSubject = new BehaviorSubject<UserProgress>({
    totalXp: 0,
    level: 1,
    currentStreak: 0,
  });
  readonly progress$ = this.progressSubject.asObservable();

  initializeForUser(userId: string): void {
    const templates = this.readTemplates(userId);
    this.templatesSubject.next(templates);

    const progress = this.readProgress(userId);
    this.progressSubject.next(progress);

    this.materializeTodayQuests(userId);
  }

  clearState(): void {
    this.templatesSubject.next([]);
    this.todayQuestsSubject.next([]);
    this.progressSubject.next({ totalXp: 0, level: 1, currentStreak: 0 });
  }

  createQuestTemplate(userId: string, title: string, difficulty: Difficulty, recurrence: Recurrence): { ok: boolean; message: string } {
    if (!title.trim()) {
      return { ok: false, message: 'Quest title is required.' };
    }

    const normalizedTitle = title.trim();
    const templates = this.readTemplates(userId);
    const normalizedDays = [...recurrence.daysOfWeek].sort().join(',');
    const duplicate = templates.some((t) => {
      const templateDays = [...t.recurrence.daysOfWeek].sort().join(',');
      return !t.archived
        && t.title.toLowerCase() === normalizedTitle.toLowerCase()
        && t.difficulty === difficulty
        && t.recurrence.type === recurrence.type
        && templateDays === normalizedDays;
    });

    if (duplicate) {
      return { ok: false, message: 'A matching active quest already exists.' };
    }

    const template: QuestTemplate = {
      id: randomId('qt'),
      userId,
      title: normalizedTitle,
      difficulty,
      recurrence,
      createdAt: new Date().toISOString(),
      archived: false,
    };

    templates.push(template);
    this.writeTemplates(userId, templates);
    this.templatesSubject.next(templates);
    this.materializeTodayQuests(userId);

    return { ok: true, message: 'Quest added.' };
  }

  completeQuest(userId: string, questInstanceId: string): { ok: boolean; message: string; gainedXp?: number } {
    const today = toDateOnly(new Date());
    const instances = this.readInstances(userId);
    const target = instances.find((q) => q.id === questInstanceId && q.questDate === today);

    if (!target) {
      return { ok: false, message: 'Quest not found for today.' };
    }

    if (target.completedAt) {
      return { ok: false, message: 'Quest already completed. XP already awarded.' };
    }

    const completionDate = new Date().toISOString();
    const completionKey = `${target.templateId}:${today}`;
    const completionUsed = instances.some((q) => q.completionKey === completionKey);

    if (completionUsed) {
      return { ok: false, message: 'Duplicate completion blocked for this quest/day.' };
    }

    target.completedAt = completionDate;
    target.completionKey = completionKey;

    const progress = this.readProgress(userId);
    const update = updateProgressOnCompletion(progress, target.difficulty, completionDate);

    this.writeInstances(userId, instances);
    this.writeProgress(userId, update.progress);

    this.todayQuestsSubject.next(instances.filter((q) => q.questDate === today));
    this.progressSubject.next(update.progress);

    return {
      ok: true,
      message: update.leveledUp ? 'Quest completed. Level up!' : 'Quest completed. XP added.',
      gainedXp: update.gainedXp,
    };
  }

  getTodayProgress(): { percent: number; current: number; needed: number } {
    const breakdown = getXpIntoLevel(this.progressSubject.value.totalXp);
    const percent = Math.floor((breakdown.xpIntoLevel / breakdown.xpForNextLevel) * 100);

    return {
      percent,
      current: breakdown.xpIntoLevel,
      needed: breakdown.xpForNextLevel,
    };
  }

  private materializeTodayQuests(userId: string): void {
    const today = new Date();
    const todayDateOnly = toDateOnly(today);
    const dayOfWeek = today.getUTCDay();

    const templates = this.readTemplates(userId).filter((t) => !t.archived);
    const instances = this.readInstances(userId);

    for (const template of templates) {
      if (!this.matchesRecurrence(template.recurrence, dayOfWeek)) {
        continue;
      }

      const exists = instances.some(
        (q) => q.templateId === template.id && q.questDate === todayDateOnly
      );

      if (exists) {
        continue;
      }

      instances.push({
        id: randomId('qi'),
        templateId: template.id,
        userId,
        title: template.title,
        difficulty: template.difficulty,
        questDate: todayDateOnly,
      });
    }

    this.writeInstances(userId, instances);
    this.todayQuestsSubject.next(instances.filter((q) => q.questDate === todayDateOnly));
  }

  private matchesRecurrence(recurrence: Recurrence, dayOfWeek: number): boolean {
    if (recurrence.type === 'daily') {
      return true;
    }

    if (recurrence.type === 'weekdays') {
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    return recurrence.daysOfWeek.includes(dayOfWeek);
  }

  private readTemplates(userId: string): QuestTemplate[] {
    const raw = localStorage.getItem(TEMPLATE_PREFIX + userId);
    return raw ? (JSON.parse(raw) as QuestTemplate[]) : [];
  }

  private writeTemplates(userId: string, templates: QuestTemplate[]): void {
    localStorage.setItem(TEMPLATE_PREFIX + userId, JSON.stringify(templates));
  }

  private readInstances(userId: string): QuestInstance[] {
    const raw = localStorage.getItem(INSTANCE_PREFIX + userId);
    return raw ? (JSON.parse(raw) as QuestInstance[]) : [];
  }

  private writeInstances(userId: string, instances: QuestInstance[]): void {
    const sorted = [...instances].sort((a, b) => {
      const dateOrder = parseDateOnly(a.questDate).getTime() - parseDateOnly(b.questDate).getTime();
      if (dateOrder !== 0) {
        return dateOrder;
      }
      return a.title.localeCompare(b.title);
    });

    localStorage.setItem(INSTANCE_PREFIX + userId, JSON.stringify(sorted));
  }

  private readProgress(userId: string): UserProgress {
    const raw = localStorage.getItem(PROGRESS_PREFIX + userId);
    return raw
      ? (JSON.parse(raw) as UserProgress)
      : { totalXp: 0, level: 1, currentStreak: 0 };
  }

  private writeProgress(userId: string, progress: UserProgress): void {
    localStorage.setItem(PROGRESS_PREFIX + userId, JSON.stringify(progress));
  }
}
