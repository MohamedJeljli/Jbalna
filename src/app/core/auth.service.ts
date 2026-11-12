import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Role, Session } from './models';

const STORAGE_KEY = 'jbalna.session';

/** The logged-in user, kept in a signal and in localStorage so a refresh keeps you logged in. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<Session | null>(readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  login(email: string, password: string): Observable<Session> {
    return this.http.post<Session>('/api/auth/login', { email, password }).pipe(tap((s) => this.store(s)));
  }

  register(data: { name: string; email: string; password: string; role: Role }): Observable<Session> {
    return this.http.post<Session>('/api/auth/register', data).pipe(tap((s) => this.store(s)));
  }

  logout(): void {
    this.store(null);
  }

  /** Where to land after logging in, when no page asked for it. */
  homeFor(role: Role): string {
    return role === 'guide' ? '/dashboard' : '/explore';
  }

  private store(session: Session | null): void {
    this.session.set(session);
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be blocked (private mode): the session then lasts until the page is closed.
    }
  }
}

/** Only accept in-site paths for ?returnUrl=, never a link to another website. */
export function safeReturnUrl(url: string | undefined): string | null {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : null;
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
