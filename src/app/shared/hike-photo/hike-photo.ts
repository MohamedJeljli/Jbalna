import { Component, computed, input } from '@angular/core';
import { Level } from '../../core/models';
import { coverOf } from '../../core/photos';
import { MountainArt } from '../mountain-art/mountain-art';

/**
 * Picture of a hike: the photo of its mountain when we have one,
 * the illustrated mountain otherwise (for example a route added by a new guide).
 */
@Component({
  selector: 'app-hike-photo',
  imports: [MountainArt],
  template: `
    @if (photo(); as p) {
      <img [src]="p.small" [alt]="p.alt" [style.object-position]="p.focus" loading="lazy" decoding="async" />
    } @else {
      <app-mountain-art [level]="level()" [seed]="seed()" />
    }
  `,
  styles: `
    :host { display: block; overflow: hidden; background: var(--forest); }
    img, app-mountain-art { display: block; width: 100%; height: 100%; }
    img { object-fit: cover; }
  `,
})
export class HikePhoto {
  readonly mountain = input.required<string>();
  readonly level = input.required<Level>();
  /** Only used by the illustration, to vary its shape. */
  readonly seed = input(0);

  protected readonly photo = computed(() => coverOf(this.mountain(), this.level()));
}
