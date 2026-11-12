import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { GuideService } from '../../core/guide.service';
import { LOADING, load } from '../../core/load';
import { HikeCard } from '../../shared/hike-card/hike-card';
import { Stars } from '../../shared/stars/stars';

/** Public profile of a guide: bio, languages, upcoming hikes and reviews. */
@Component({
  selector: 'app-guide-profile',
  imports: [RouterLink, DatePipe, HikeCard, Stars],
  templateUrl: './guide-profile.html',
  styleUrl: './guide-profile.scss',
})
export class GuideProfilePage {
  private readonly guides = inject(GuideService);

  /** The ":id" of the URL. */
  readonly id = input.required<string>();

  protected readonly state = toSignal(toObservable(this.id).pipe(switchMap((id) => load(this.guides.get(id)))), {
    initialValue: LOADING,
  });

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
