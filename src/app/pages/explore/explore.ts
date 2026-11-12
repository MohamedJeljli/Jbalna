import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, map, of, switchMap } from 'rxjs';
import { HikeService } from '../../core/hike.service';
import { LOADING, load } from '../../core/load';
import { HikeFilters, LEVELS } from '../../core/models';
import { MountainArt } from '../../shared/mountain-art/mountain-art';
import { Stars } from '../../shared/stars/stars';

const NO_PRICE_LIMIT = 100;

/**
 * Explore hikes (wireframe 2/5). The filters live in the URL (?mountain=...&level=...),
 * so a search from the home page or a shared link opens the same results.
 */
@Component({
  selector: 'app-explore',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, MountainArt, Stars],
  templateUrl: './explore.html',
  styleUrl: './explore.scss',
})
export class Explore {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly hikes = inject(HikeService);

  protected readonly levels = LEVELS;
  protected readonly noPriceLimit = NO_PRICE_LIMIT;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly filtersOpen = signal(false);

  protected readonly filters = inject(FormBuilder).nonNullable.group({
    q: '',
    mountain: '',
    level: '',
    date: '',
    maxPrice: NO_PRICE_LIMIT,
    sort: 'date',
  });

  protected readonly mountains = toSignal(this.hikes.mountains().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  /** Results follow the URL: each change of query params runs a new search. */
  protected readonly results = toSignal(
    this.route.queryParamMap.pipe(
      map(toFilters),
      switchMap((filters) => load(this.hikes.list(filters))),
    ),
    { initialValue: LOADING },
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    // URL -> form (first load, home page search, back button)
    this.route.queryParamMap.pipe(takeUntilDestroyed(destroyRef)).subscribe((params) => {
      this.filters.patchValue(
        {
          q: params.get('q') ?? '',
          mountain: params.get('mountain') ?? '',
          level: params.get('level') ?? '',
          date: params.get('date') ?? '',
          maxPrice: Number(params.get('maxPrice')) || NO_PRICE_LIMIT,
          sort: params.get('sort') ?? 'date',
        },
        { emitEvent: false },
      );
    });

    // Form -> URL (debounced so typing in the search box does not fire a request per key)
    this.filters.valueChanges.pipe(debounceTime(250), takeUntilDestroyed(destroyRef)).subscribe(() => {
      const value = this.filters.getRawValue();
      const queryParams: Record<string, string> = {};
      if (value.q.trim()) queryParams['q'] = value.q.trim();
      if (value.mountain) queryParams['mountain'] = value.mountain;
      if (value.level) queryParams['level'] = value.level;
      if (value.date) queryParams['date'] = value.date;
      if (value.maxPrice < NO_PRICE_LIMIT) queryParams['maxPrice'] = String(value.maxPrice);
      if (value.sort !== 'date') queryParams['sort'] = value.sort;
      this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
    });
  }

  protected reset(): void {
    this.filters.reset();
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }
}

function toFilters(params: ParamMap): HikeFilters {
  const filters: HikeFilters = {};
  for (const key of ['q', 'mountain', 'level', 'date', 'maxPrice', 'sort'] as const) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  return filters;
}
