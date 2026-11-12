/** An error with an HTTP status; the error handler in index.ts sends it to the client. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Small input validators: each returns the clean value or throws a 400 with a readable message.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireText(value: unknown, field: string, min = 1, max = 2000): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < min || text.length > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max} characters.`);
  }
  return text;
}

export function requireEmail(value: unknown): string {
  const email = requireText(value, 'Email', 3, 160).toLowerCase();
  if (!EMAIL.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  return email;
}

export function requireNumber(value: unknown, field: string, min: number, max: number): number {
  const number = Number(value);
  if (value === '' || value === null || !Number.isFinite(number) || number < min || number > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max}.`);
  }
  return number;
}

export function requireOneOf<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (!allowed.includes(value as T)) {
    throw new HttpError(400, `${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}

export function requireDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, `${field} must be a date (YYYY-MM-DD).`);
  }
  return value;
}

export function requireId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Not found.');
  return id;
}
