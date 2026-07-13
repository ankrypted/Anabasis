/// <reference types="jasmine" />

import { QuestService } from './quest.service';

describe('QuestService', () => {
  const userId = 'user_test';
  let service: QuestService;

  beforeEach(() => {
    localStorage.clear();
    service = new QuestService();
    service.initializeForUser(userId);
  });

  it('should materialize a daily quest for today', () => {
    const create = service.createQuestTemplate(userId, 'Read 20 pages', 'easy', {
      type: 'daily',
      daysOfWeek: [],
    });

    expect(create.ok).toBeTrue();

    let questsCount = 0;
    service.todayQuests$.subscribe((quests) => {
      questsCount = quests.length;
    }).unsubscribe();

    expect(questsCount).toBe(1);
  });

  it('should block duplicate completion XP for same quest/day', () => {
    service.createQuestTemplate(userId, 'Workout', 'medium', {
      type: 'daily',
      daysOfWeek: [],
    });

    let questId = '';
    service.todayQuests$.subscribe((quests) => {
      questId = quests[0]?.id ?? '';
    }).unsubscribe();

    expect(questId).toBeTruthy();

    const first = service.completeQuest(userId, questId);
    const second = service.completeQuest(userId, questId);

    expect(first.ok).toBeTrue();
    expect(second.ok).toBeFalse();
    expect(second.message).toContain('already completed');
  });

  it('should avoid duplicate template entries with same recurrence', () => {
    const first = service.createQuestTemplate(userId, 'Meditate', 'easy', {
      type: 'weekdays',
      daysOfWeek: [],
    });
    const second = service.createQuestTemplate(userId, 'Meditate', 'easy', {
      type: 'weekdays',
      daysOfWeek: [],
    });

    expect(first.ok).toBeTrue();
    expect(second.ok).toBeFalse();
  });
});
