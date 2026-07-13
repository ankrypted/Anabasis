import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const FILL_DURATION_MS = 1800;

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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly circumference = CIRCUMFERENCE;
  readonly targetPercent = 90;
  readonly level = 4;
  readonly ticks = buildTicks();

  percent = 0;
  dashoffset = CIRCUMFERENCE;

  private rafId: number | null = null;

  ngOnInit(): void {
    this.animateFill();
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private animateFill(): void {
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min((now - start) / FILL_DURATION_MS, 1);
      const eased = easeOutCubic(t);

      this.percent = Math.round(eased * this.targetPercent);
      this.dashoffset = this.circumference * (1 - (eased * this.targetPercent) / 100);

      this.rafId = t < 1 ? requestAnimationFrame(step) : null;
    };

    this.rafId = requestAnimationFrame(step);
  }
}
