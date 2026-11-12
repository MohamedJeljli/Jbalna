import { Component, computed, input } from '@angular/core';
import { Level } from '../../core/models';

// Sky and ridge colours per level, taken from the badge colours of the charter.
const PALETTE: Record<Level, { sky: string; ridge: string }> = {
  Easy: { sky: '#bcd2c2', ridge: '#2e6b4a' },
  Medium: { sky: '#e9c77b', ridge: '#2c463a' },
  Hard: { sky: '#d59a72', ridge: '#7c3524' },
};

const RIDGES = [
  'M0 120 L0 82 L70 46 L125 88 L190 18 L255 76 L300 54 L300 120 Z',
  'M0 120 L0 70 L60 30 L120 80 L170 50 L240 92 L300 40 L300 120 Z',
  'M0 120 L0 90 L90 28 L150 70 L210 40 L270 84 L300 66 L300 120 Z',
];
const FRONTS = [
  'M0 120 L0 104 L85 70 L160 106 L235 80 L300 100 L300 120 Z',
  'M0 120 L0 96 L70 106 L140 76 L220 108 L300 86 L300 120 Z',
  'M0 120 L0 100 L110 84 L180 110 L250 74 L300 98 L300 120 Z',
];
const SUN_X = [236, 62, 150];

/**
 * Illustrated mountain used in place of photos until guides can upload pictures.
 * The colours follow the level; the shape varies with the seed (route id).
 */
@Component({
  selector: 'app-mountain-art',
  template: `
    <svg viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="300" height="120" [attr.fill]="colors().sky" />
      <circle [attr.cx]="shape().sunX" cy="34" r="14" fill="#f5f0e6" />
      <path [attr.d]="shape().ridge" [attr.fill]="colors().ridge" />
      <path [attr.d]="shape().front" fill="#17261f" />
    </svg>
  `,
  styles: `
    :host { display: block; overflow: hidden; }
    svg { display: block; width: 100%; height: 100%; }
  `,
})
export class MountainArt {
  readonly level = input.required<Level>();
  readonly seed = input(0);

  protected readonly colors = computed(() => PALETTE[this.level()]);
  protected readonly shape = computed(() => {
    const i = Math.abs(this.seed()) % 3;
    return { ridge: RIDGES[i], front: FRONTS[i], sunX: SUN_X[i] };
  });
}
