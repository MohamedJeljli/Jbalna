import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../core/booking.service';
import { apiMessage } from '../../core/load';
import { Booking } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { HikePhoto } from '../../shared/hike-photo/hike-photo';

/** Hiker space: upcoming hikes first, then past ones with "Leave a review". */
@Component({
  selector: 'app-my-bookings',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, HikePhoto],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.scss',
})
export class MyBookings {
  private readonly service = inject(BookingService);
  private readonly toasts = inject(ToastService);

  protected readonly bookings = signal<Booking[] | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly upcoming = computed(() =>
    (this.bookings() ?? []).filter((b) => !b.isPast && b.status === 'confirmed').reverse(),
  );
  protected readonly past = computed(() => (this.bookings() ?? []).filter((b) => b.isPast || b.status === 'cancelled'));

  /** Booking whose review form is open. */
  protected readonly reviewing = signal<number | null>(null);
  protected readonly busy = signal<number | null>(null);
  protected readonly ratings = [5, 4, 3, 2, 1];

  protected readonly reviewForm = inject(FormBuilder).nonNullable.group({
    rating: [0, [Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.service.mine().subscribe({
      next: (bookings) => this.bookings.set(bookings),
      error: (error) => this.error.set(apiMessage(error)),
    });
  }

  protected cancel(booking: Booking): void {
    if (!confirm(`Cancel your booking on ${booking.mountain}?`)) return;
    this.busy.set(booking.id);
    this.service.cancel(booking.id).subscribe({
      next: () => {
        this.busy.set(null);
        this.toasts.success('Booking cancelled. Your guide has been told.');
        this.bookings.update((list) =>
          (list ?? []).map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' as const } : b)),
        );
      },
      error: (error) => {
        this.busy.set(null);
        this.toasts.error(apiMessage(error));
      },
    });
  }

  protected openReview(id: number): void {
    this.reviewForm.reset();
    this.reviewing.set(this.reviewing() === id ? null : id);
  }

  protected sendReview(booking: Booking): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    const { rating, comment } = this.reviewForm.getRawValue();
    this.busy.set(booking.id);
    this.service.review(booking.id, rating, comment).subscribe({
      next: () => {
        this.busy.set(null);
        this.reviewing.set(null);
        this.toasts.success(`Thank you! Your review helps ${booking.guideName.split(' ')[0]}.`);
        this.bookings.update((list) =>
          (list ?? []).map((b) => (b.id === booking.id ? { ...b, reviewRating: rating } : b)),
        );
      },
      error: (error) => {
        this.busy.set(null);
        this.toasts.error(apiMessage(error));
      },
    });
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
