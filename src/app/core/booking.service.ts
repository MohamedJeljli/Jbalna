import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from './models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  book(hikeId: number, spots: number): Observable<{ id: number }> {
    return this.http.post<{ id: number }>('/api/bookings', { hikeId, spots });
  }

  mine(): Observable<Booking[]> {
    return this.http.get<Booking[]>('/api/bookings/mine');
  }

  cancel(id: number): Observable<unknown> {
    return this.http.patch(`/api/bookings/${id}/cancel`, {});
  }

  review(id: number, rating: number, comment: string): Observable<unknown> {
    return this.http.post(`/api/bookings/${id}/review`, { rating, comment });
  }
}
