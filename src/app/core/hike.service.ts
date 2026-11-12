import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Hike, HikeDetail, HikeFilters, MyRoute, Participant } from './models';

export interface NewHike {
  routeId: number;
  date: string;
  priceDt: number;
  spots: number;
  meetingPoint: string;
}

export type NewRoute = Omit<MyRoute, 'id' | 'upcomingHikes'>;

@Injectable({ providedIn: 'root' })
export class HikeService {
  private readonly http = inject(HttpClient);

  list(filters: HikeFilters = {}): Observable<Hike[]> {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    return this.http.get<Hike[]>('/api/hikes', { params });
  }

  popular(): Observable<Hike[]> {
    return this.list({ sort: 'popular', limit: '3' });
  }

  mountains(): Observable<string[]> {
    return this.http.get<string[]>('/api/hikes/mountains');
  }

  get(id: number | string): Observable<HikeDetail> {
    return this.http.get<HikeDetail>(`/api/hikes/${id}`);
  }

  // Guide space
  create(hike: NewHike): Observable<Hike> {
    return this.http.post<Hike>('/api/hikes', hike);
  }

  participants(hikeId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(`/api/hikes/${hikeId}/participants`);
  }

  myRoutes(): Observable<MyRoute[]> {
    return this.http.get<MyRoute[]>('/api/routes/mine');
  }

  createRoute(route: NewRoute): Observable<MyRoute> {
    return this.http.post<MyRoute>('/api/routes', route);
  }
}
