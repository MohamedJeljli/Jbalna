import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LEVELS, MOUNTAINS } from '../../core/hike';
import { HikeService } from '../../core/hike.service';
import { HikeCard } from '../../shared/hike-card/hike-card';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, HikeCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);

  protected readonly popularHikes = inject(HikeService).popular;
  protected readonly mountains = MOUNTAINS;
  protected readonly levels = LEVELS;
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
}
