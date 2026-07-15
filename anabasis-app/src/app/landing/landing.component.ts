import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  { percent: 20, tag: 0 }, // Add Quests
  { percent: 45, tag: 1 }, // Finish Tasks
  { percent: 70, tag: 2 }, // Keep Streak Active
  { percent: 90, tag: 3 }, // Gain XP
];

const FILL_SEGMENT_MS = 800;
const TAG_HOLD_MS = 1400;
const TAG_FADE_MS = 450;
const LOOP_RESTART_DELAY_MS = 500;
const LOOP_END_HOLD_MS = 1200;

const CORE_LOOP_LINE_MS = 1800;
const CORE_LOOP_RESTART_DELAY_MS = 500;
const CORE_LOOP_END_HOLD_MS = 1400;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly circumference = CIRCUMFERENCE;
  readonly ticks = buildTicks();

  readonly currentYear = new Date().getFullYear();

  readonly coreLoop = ['Create Quest', 'Complete Quest', 'Earn XP', 'Build Streak', 'Level Up'];

  readonly features = [
    {
      icon: '📜',
      title: 'Quest Management',
      description: 'Create, edit, and track quests with custom difficulty, deadlines, and recurrence.',
    },
    {
      icon: '⚡',
      title: 'XP & Leveling',
      description: 'Earn XP based on difficulty and level up automatically as you progress.',
    },
    {
      icon: '🔥',
      title: 'Streaks',
      description: 'Build consecutive completion streaks and track your current and longest runs.',
    },
    {
      icon: '📊',
      title: 'Dashboard',
      description: 'See your full progression history and overall progress at a glance.',
    },
  ];

  percent = 0;
  dashoffset = CIRCUMFERENCE;
  activeTag = -1;

  @ViewChild('coreLoopSection') coreLoopSection?: ElementRef<HTMLElement>;
  lineProgress = 0;

  private rafId: number | null = null;
  private coreLoopRafId: number | null = null;
  private coreLoopObserver: IntersectionObserver | null = null;
  private coreLoopStarted = false;
  private destroyed = false;

  ngOnInit(): void {
    this.runLoop();
  }

  ngAfterViewInit(): void {
    if (!this.coreLoopSection) return;

    this.coreLoopObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !this.coreLoopStarted) {
          this.coreLoopStarted = true;
          this.runCoreLoopAnimation();
          this.coreLoopObserver?.disconnect();
        }
      }
    }, { threshold: 0.4 });

    this.coreLoopObserver.observe(this.coreLoopSection.nativeElement);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.coreLoopRafId !== null) {
      cancelAnimationFrame(this.coreLoopRafId);
    }
    this.coreLoopObserver?.disconnect();
  }

  isStepVisible(index: number): boolean {
    const thresholdPercent = (index / (this.coreLoop.length - 1)) * 100;
    return this.lineProgress >= thresholdPercent;
  }

  private async runCoreLoopAnimation(): Promise<void> {
    while (!this.destroyed) {
      this.lineProgress = 0;
      await this.wait(CORE_LOOP_RESTART_DELAY_MS);

      if (this.destroyed) return;
      await this.animateCoreLoopFill(CORE_LOOP_LINE_MS);

      if (this.destroyed) return;
      await this.wait(CORE_LOOP_END_HOLD_MS);
    }
  }

  private animateCoreLoopFill(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();

      const step = (now: number) => {
        if (this.destroyed) {
          resolve();
          return;
        }

        const t = Math.min((now - start) / duration, 1);
        this.lineProgress = Math.round(t * 100);

        if (t < 1) {
          this.coreLoopRafId = requestAnimationFrame(step);
        } else {
          this.coreLoopRafId = null;
          resolve();
        }
      };

      this.coreLoopRafId = requestAnimationFrame(step);
    });
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
