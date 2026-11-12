import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, startWith } from 'rxjs';

/** State of a request shown in a template: loading, loaded data, or an error message. */
export interface Load<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}

export const LOADING: Load<never> = { loading: true, data: null, error: null };

/** Turns a request into a stream of Load states (loading first, then data or error). */
export function load<T>(request: Observable<T>): Observable<Load<T>> {
  return request.pipe(
    map((data) => ({ loading: false, data, error: null })),
    catchError((error) => of({ loading: false, data: null, error: apiMessage(error) })),
    startWith(LOADING),
  );
}

/** A readable message for any failed API call. */
export function apiMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Cannot reach the Jbalna server. Is the API running?';
    const message = (error.error as { message?: string } | null)?.message;
    if (message) return message;
  }
  return 'Something went wrong. Please try again.';
}
