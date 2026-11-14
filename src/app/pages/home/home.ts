import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { HikeService } from '../../core/hike.service';
import { LOADING, load } from '../../core/load';
import { LEVELS } from '../../core/models';
import { HERO_PHOTO } from '../../core/photos';
import { HikeCard } from '../../shared/hike-card/hike-card';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, HikeCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  private readonly hikes = inject(HikeService);

  protected readonly popular = toSignal(load(this.hikes.popular()), { initialValue: LOADING });
  protected readonly mountains = toSignal(this.hikes.mountains().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
  protected readonly levels = LEVELS;
  protected readonly heroPhoto = HERO_PHOTO;
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly search = inject(FormBuilder).nonNullable.group({
    mountain: '',
    date: '',
    level: '',
  });

  /** Click 1 of the 3-click rule: send the chosen filters to the Explore page. */
  protected onSearch(): void {
    const filters = Object.fromEntries(
      Object.entries(this.search.getRawValue()).filter(([, value]) => value !== ''),
    );
    this.router.navigate(['/explore'], { queryParams: filters });
  }

  protected retry(): void {
    location.reload();
  }
}
