import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { QuestService } from './quest.service';
import { Difficulty, QuestInstance, SessionUser, UserProgress } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly weekdays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  sessionUser: SessionUser | null = null;
  quests: QuestInstance[] = [];
  progress: UserProgress = { totalXp: 0, level: 1, currentStreak: 0 };
  levelProgress = { percent: 0, current: 0, needed: 100 };

  authMode: 'login' | 'register' = 'login';
  authEmail = '';
  authPassword = '';

  questTitle = '';
  questDifficulty: Difficulty = 'easy';
  recurrenceType: 'daily' | 'weekdays' | 'custom' = 'daily';
  customDays = [1, 3, 5];

  statusMessage = '';

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly questService: QuestService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.session$.subscribe((session) => {
        this.sessionUser = session;
        this.statusMessage = '';

        if (session) {
          this.questService.initializeForUser(session.id);
          this.levelProgress = this.questService.getTodayProgress();
        } else {
          this.questService.clearState();
        }
      })
    );

    this.subscriptions.add(
      this.questService.todayQuests$.subscribe((quests) => {
        this.quests = quests;
      })
    );

    this.subscriptions.add(
      this.questService.progress$.subscribe((progress) => {
        this.progress = progress;
        this.levelProgress = this.questService.getTodayProgress();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  submitAuth(): void {
    if (this.authMode === 'register') {
      const result = this.authService.register(this.authEmail, this.authPassword);
      this.statusMessage = result.message;
    } else {
      const result = this.authService.login(this.authEmail, this.authPassword);
      this.statusMessage = result.message;
    }

    if (this.sessionUser) {
      this.authEmail = '';
      this.authPassword = '';
    }
  }

  logout(): void {
    this.authService.logout();
    this.statusMessage = 'Logged out.';
  }

  addQuest(): void {
    if (!this.sessionUser) {
      return;
    }

    const recurrenceDays = this.recurrenceType === 'custom'
      ? [...this.customDays]
      : [];

    const result = this.questService.createQuestTemplate(
      this.sessionUser.id,
      this.questTitle,
      this.questDifficulty,
      {
        type: this.recurrenceType,
        daysOfWeek: recurrenceDays,
      }
    );

    this.statusMessage = result.message;
    if (result.ok) {
      this.questTitle = '';
      this.questDifficulty = 'easy';
      this.recurrenceType = 'daily';
      this.customDays = [1, 3, 5];
    }
  }

  completeQuest(questId: string): void {
    if (!this.sessionUser) {
      return;
    }

    const result = this.questService.completeQuest(this.sessionUser.id, questId);
    this.statusMessage = result.ok && result.gainedXp
      ? `${result.message} +${result.gainedXp} XP`
      : result.message;
  }

  toggleCustomDay(day: number): void {
    if (this.customDays.includes(day)) {
      this.customDays = this.customDays.filter((d) => d !== day);
      return;
    }

    this.customDays = [...this.customDays, day].sort((a, b) => a - b);
  }

  isDaySelected(day: number): boolean {
    return this.customDays.includes(day);
  }

  get completionCount(): number {
    return this.quests.filter((q) => !!q.completedAt).length;
  }

  difficultyLabel(difficulty: Difficulty): string {
    if (difficulty === 'easy') {
      return 'Easy';
    }

    if (difficulty === 'medium') {
      return 'Medium';
    }

    return 'Hard';
  }
}
