import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { BookingService } from '../../core/booking.service';
import { HikeService } from '../../core/hike.service';
import { LOADING, apiMessage, load } from '../../core/load';
import { ToastService } from '../../core/toast.service';
import { MountainArt } from '../../shared/mountain-art/mountain-art';
import { Stars } from '../../shared/stars/stars';

const MAX_SPOTS_PER_BOOKING = 10;

/** Hike page (wireframe 3/5): facts, description, meeting point, guide card and booking card. */
@Component({
  selector: 'app-hike-detail',
  imports: [RouterLink, DatePipe, MountainArt, Stars],
  templateUrl: './hike-detail.html',
  styleUrl: './hike-detail.scss',
})
export class HikeDetailPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly bookings = inject(BookingService);
  private readonly toasts = inject(ToastService);
  private readonly hikes = inject(HikeService);

  /** The ":id" of the URL (component input binding). */
  readonly id = input.required<string>();

  protected readonly state = toSignal(toObservable(this.id).pipe(switchMap((id) => load(this.hikes.get(id)))), {
    initialValue: LOADING,
  });
  protected readonly hike = computed(() => this.state().data);

  /** Date chosen in the booking card: this hike by default, or another date of the same route. */
  protected readonly selectedId = linkedSignal(() => {
    const hike = this.hike();
    if (!hike) return null;
    return hike.dates.some((d) => d.id === hike.id) ? hike.id : (hike.dates[0]?.id ?? null);
  });
  protected readonly selected = computed(() => this.hike()?.dates.find((d) => d.id === this.selectedId()) ?? null);

  protected readonly spots = linkedSignal<number>(() => (this.selectedId() ? 1 : 0));
  protected readonly maxSpots = computed(() => Math.min(this.selected()?.spotsLeft ?? 0, MAX_SPOTS_PER_BOOKING));
  protected readonly total = computed(() => (this.selected()?.priceDt ?? 0) * this.spots());
  protected readonly booking = signal(false);

  protected readonly user = this.auth.user;
  protected readonly languages = computed(() => this.hike()?.guide.languages ?? '');

  protected changeSpots(delta: number): void {
    this.spots.update((n) => Math.min(Math.max(1, n + delta), this.maxSpots()));
  }

  protected book(): void {
    const selected = this.selected();
    if (!selected) return;

    const user = this.user();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (user.role !== 'hiker') {
      this.toasts.error('Bookings are made with a hiker account.');
      return;
    }

    this.booking.set(true);
    this.bookings.book(selected.id, this.spots()).subscribe({
      next: () => {
        const n = this.spots();
        this.toasts.success(`Booked! ${n} ${n === 1 ? 'spot' : 'spots'} on ${this.hike()?.route.mountain}.`);
        this.router.navigateByUrl('/my-bookings');
      },
      error: (error) => {
        this.booking.set(false);
        this.toasts.error(apiMessage(error));
      },
    });
  }
}
