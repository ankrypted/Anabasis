import { Component, OnDestroy, OnInit } from '@angular/core';

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const FILL_DURATION_MS = 1800;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly circumference = CIRCUMFERENCE;
  readonly targetPercent = 90;

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
