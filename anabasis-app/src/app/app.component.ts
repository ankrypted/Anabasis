import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TICK_COUNT = 48;
const TICK_INNER_R = 68;
const TICK_OUTER_R = 76;

interface Tick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function buildTicks(): Tick[] {
  const ticks: Tick[] = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const angle = (i / TICK_COUNT) * 2 * Math.PI;
    ticks.push({
      x1: 100 + TICK_INNER_R * Math.cos(angle),
      y1: 100 + TICK_INNER_R * Math.sin(angle),
      x2: 100 + TICK_OUTER_R * Math.cos(angle),
      y2: 100 + TICK_OUTER_R * Math.sin(angle),
    });
  }
  return ticks;
}

interface Stage {
  percent: number;
  tag: number;
}

const STAGES: Stage[] = [
  { percent: 20, tag: 0 }, // Level 4 reached
  { percent: 45, tag: 1 }, // New quest available
  { percent: 70, tag: 2 }, // 7-day streak active
  { percent: 90, tag: 3 }, // Quest completed: +50 XP
];

const FILL_SEGMENT_MS = 800;
const TAG_HOLD_MS = 1400;
const TAG_FADE_MS = 450;
const LOOP_RESTART_DELAY_MS = 500;
const LOOP_END_HOLD_MS = 1200;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly circumference = CIRCUMFERENCE;
  readonly level = 4;
  readonly ticks = buildTicks();

  percent = 0;
  dashoffset = CIRCUMFERENCE;
  activeTag = -1;

  private rafId: number | null = null;
  private destroyed = false;

  ngOnInit(): void {
    this.runLoop();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private async runLoop(): Promise<void> {
    while (!this.destroyed) {
      this.percent = 0;
      this.dashoffset = this.circumference;
      this.activeTag = -1;
      await this.wait(LOOP_RESTART_DELAY_MS);

      for (const stage of STAGES) {
        if (this.destroyed) return;
        await this.animateFillTo(stage.percent, FILL_SEGMENT_MS);

        if (this.destroyed) return;
        this.activeTag = stage.tag;
        await this.wait(TAG_HOLD_MS);

        if (this.destroyed) return;
        this.activeTag = -1;
        await this.wait(TAG_FADE_MS);
      }

      if (this.destroyed) return;
      await this.wait(LOOP_END_HOLD_MS);
    }
  }

  private animateFillTo(toPercent: number, duration: number): Promise<void> {
    const fromPercent = this.percent;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    return new Promise((resolve) => {
      const start = performance.now();

      const step = (now: number) => {
        if (this.destroyed) {
          resolve();
          return;
        }

        const t = Math.min((now - start) / duration, 1);
        const eased = easeOutCubic(t);
        const current = fromPercent + (toPercent - fromPercent) * eased;

        this.percent = Math.round(current);
        this.dashoffset = this.circumference * (1 - current / 100);

        if (t < 1) {
          this.rafId = requestAnimationFrame(step);
        } else {
          this.rafId = null;
          resolve();
        }
      };

      this.rafId = requestAnimationFrame(step);
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
