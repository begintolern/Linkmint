// lib/api/http.ts

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  error: string;          // stable machine-readable code, e.g. "VALIDATION_ERROR"
  message?: string;       // optional human message
  details?: unknown;      // optional extra info (e.g., validation field map)
};

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}

export function err(
  code: string,
  message?: string,
  details?: unknown
): ApiErr {
  return { ok: false, error: code, ...(message ? { message } : {}), ...(details ? { details } : {}) };
}

/** Map common errors to HTTP status codes for NextResponse usage. */
export function statusFor(code: string): number {
  switch (code) {
    case "UNAUTHORIZED": return 401;
    case "FORBIDDEN":    return 403;
    case "NOT_FOUND":    return 404;
    case "VALIDATION_ERROR": return 422;
    case "CONFLICT":     return 409;
    case "RATE_LIMITED": return 429;
    default:             return 400;
  }
}
