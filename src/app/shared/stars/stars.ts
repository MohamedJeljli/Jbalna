import { Component, computed, input } from '@angular/core';

/** Read-only rating: "★ 4.7 (12 reviews)", or "New guide" when there is no review yet. */
@Component({
  selector: 'app-stars',
  template: `
    @if (rating() !== null) {
      <span class="stars" [attr.aria-label]="label()">
        <span class="star" aria-hidden="true">★</span>
        <strong>{{ rating() }}</strong>
        @if (count() !== null) {
          <span class="count">({{ count() }} {{ count() === 1 ? 'review' : 'reviews' }})</span>
        }
      </span>
    } @else {
      <span class="stars count">New guide</span>
    }
  `,
  styles: `
    .stars { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
    .star { color: #b07a12; }
    .count { color: var(--slate); font-size: 14px; }
  `,
})
export class Stars {
  readonly rating = input<number | null>(null);
  readonly count = input<number | null>(null);

  protected readonly label = computed(() => {
    const count = this.count();
    return `Rated ${this.rating()} out of 5` + (count === null ? '' : ` from ${count} reviews`);
  });
}
