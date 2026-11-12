import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Guide, GuideDashboard, GuideProfile } from './models';

@Injectable({ providedIn: 'root' })
export class GuideService {
  private readonly http = inject(HttpClient);

  list(): Observable<Guide[]> {
    return this.http.get<Guide[]>('/api/guides');
  }

  get(id: number | string): Observable<GuideProfile> {
    return this.http.get<GuideProfile>(`/api/guides/${id}`);
  }

  dashboard(): Observable<GuideDashboard> {
    return this.http.get<GuideDashboard>('/api/guides/me/dashboard');
  }
}
