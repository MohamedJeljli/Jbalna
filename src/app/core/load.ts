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
    // Our API always answers JSON { message }. Anything else (no answer, an HTML page, a proxy
    // error) means the request never reached it.
    const body = error.error as { message?: unknown } | null;
    const fromApi = typeof body === 'object' && body !== null && !(body instanceof Error) && typeof body.message === 'string';
    if (fromApi) return body.message as string;
    return 'Cannot reach the Jbalna API. Make sure it is running (npm run api) and try again.';
  }
  return 'Something went wrong. Please try again.';
}
