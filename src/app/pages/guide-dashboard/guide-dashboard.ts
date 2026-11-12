import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { GuideService } from '../../core/guide.service';
import { HikeService } from '../../core/hike.service';
import { apiMessage } from '../../core/load';
import { GuideDashboard, LEVELS, Level, MyRoute, Participant } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Stars } from '../../shared/stars/stars';

type Panel = 'hike' | 'route' | null;

/** Guide space (wireframe 4/5): run hikes and bookings from one screen. */
@Component({
  selector: 'app-guide-dashboard',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, Stars],
  templateUrl: './guide-dashboard.html',
  styleUrl: './guide-dashboard.scss',
})
export class GuideDashboardPage {
  private readonly guides = inject(GuideService);
  private readonly hikes = inject(HikeService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly data = signal<GuideDashboard | null>(null);
  protected readonly routes = signal<MyRoute[]>([]);
  protected readonly error = signal<string | null>(null);

  protected readonly panel = signal<Panel>(null);
  protected readonly saving = signal(false);
  protected readonly levels = LEVELS;
  protected readonly today = new Date().toISOString().slice(0, 10);

  /** Participants of the hike opened in the table. */
  protected readonly openHike = signal<number | null>(null);
  protected readonly participants = signal<Participant[] | null>(null);

  protected readonly hikeForm = this.fb.group({
    routeId: [0, Validators.min(1)],
    date: ['', Validators.required],
    priceDt: [40, [Validators.required, Validators.min(1), Validators.max(1000)]],
    spots: [12, [Validators.required, Validators.min(1), Validators.max(30)]],
    meetingPoint: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
  });

  protected readonly routeForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    mountain: ['', [Validators.required, Validators.minLength(3)]],
    region: ['', [Validators.required, Validators.minLength(2)]],
    level: ['Medium' as Level, Validators.required],
    distanceKm: [10, [Validators.required, Validators.min(0.5), Validators.max(100)]],
    elevationM: [500, [Validators.required, Validators.min(0), Validators.max(5000)]],
    durationHours: [4, [Validators.required, Validators.min(0.5), Validators.max(24)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    forkJoin({ dashboard: this.guides.dashboard(), routes: this.hikes.myRoutes() }).subscribe({
      next: ({ dashboard, routes }) => {
        this.data.set(dashboard);
        this.routes.set(routes);
      },
      error: (error) => this.error.set(apiMessage(error)),
    });
  }

  protected open(panel: Panel, routeId?: number): void {
    this.panel.set(this.panel() === panel && routeId === undefined ? null : panel);
    if (panel === 'hike') {
      this.hikeForm.reset();
      this.hikeForm.controls.routeId.setValue(routeId ?? this.routes()[0]?.id ?? 0);
    }
    if (panel === 'route') this.routeForm.reset();
  }

  protected createHike(): void {
    if (this.hikeForm.invalid) {
      this.hikeForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.hikes.create(this.hikeForm.getRawValue()).subscribe({
      next: (hike) => {
        this.saving.set(false);
        this.panel.set(null);
        this.toasts.success(`Hike published: ${hike.route.mountain} on ${hike.date}.`);
        this.load();
      },
      error: (error) => {
        this.saving.set(false);
        this.toasts.error(apiMessage(error));
      },
    });
  }

  protected createRoute(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.hikes.createRoute(this.routeForm.getRawValue()).subscribe({
      next: (route) => {
        this.saving.set(false);
        this.routes.update((routes) => [...routes, route].sort((a, b) => a.title.localeCompare(b.title)));
        this.toasts.success(`Route "${route.title}" created. Now add a date for it.`);
        this.open('hike', route.id);
      },
      error: (error) => {
        this.saving.set(false);
        this.toasts.error(apiMessage(error));
      },
    });
  }

  protected toggleParticipants(hikeId: number): void {
    if (this.openHike() === hikeId) {
      this.openHike.set(null);
      return;
    }
    this.openHike.set(hikeId);
    this.participants.set(null);
    this.hikes.participants(hikeId).subscribe({
      next: (list) => this.participants.set(list),
      error: (error) => {
        this.openHike.set(null);
        this.toasts.error(apiMessage(error));
      },
    });
  }

  protected firstName(name: string): string {
    return name.split(' ')[0];
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
