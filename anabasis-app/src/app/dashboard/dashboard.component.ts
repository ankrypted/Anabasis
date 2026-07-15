import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Difficulty, QuestInput, QuestService, Recurrence } from '../quest.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  readonly quests = inject(QuestService);

  form: QuestInput = this.emptyForm();

  submitQuest(): void {
    if (!this.form.title.trim()) return;
    this.quests.addQuest(this.form);
    this.form = this.emptyForm();
  }

  difficultyClass(difficulty: Difficulty): string {
    switch (difficulty) {
      case 'easy':
        return 'border-neon-orange/30 text-neon-orange/60';
      case 'medium':
        return 'border-neon-orange/50 text-neon-orange/80';
      case 'hard':
        return 'border-neon-orange/70 text-neon-orange';
    }
  }

  private emptyForm(): QuestInput {
    return { title: '', description: '', difficulty: 'easy' as Difficulty, recurrence: 'none' as Recurrence, deadline: null };
  }
}
