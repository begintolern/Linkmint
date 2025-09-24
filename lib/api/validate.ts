// lib/api/validate.ts
// Minimal validation helpers for API routes (no external deps).

export type FieldError = { field: string; message: string };
export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: FieldError[] };

export function requireString(field: string, v: unknown, opts?: { min?: number; max?: number; pattern?: RegExp }): FieldError | null {
  if (typeof v !== "string" || v.trim() === "") {
    return { field, message: "Required" };
  }
  const s = v.trim();
  if (opts?.min && s.length < opts.min) return { field, message: `Must be at least ${opts.min} chars` };
  if (opts?.max && s.length > opts.max) return { field, message: `Must be at most ${opts.max} chars` };
  if (opts?.pattern && !opts.pattern.test(s)) return { field, message: "Invalid format" };
  return null;
}

export function optionalString(field: string, v: unknown, opts?: { max?: number; pattern?: RegExp }): FieldError | null {
  if (v == null || v === "") return null;
  if (typeof v !== "string") return { field, message: "Must be a string" };
  const s = v.trim();
  if (opts?.max && s.length > opts.max) return { field, message: `Must be at most ${opts.max} chars` };
  if (opts?.pattern && !opts.pattern.test(s)) return { field, message: "Invalid format" };
  return null;
}

export function oneOf(field: string, v: unknown, allowed: string[]): FieldError | null {
  if (typeof v !== "string") return { field, message: "Must be a string" };
  const s = v.trim().toLowerCase();
  if (!allowed.map(a => a.toLowerCase()).includes(s)) {
    return { field, message: `Must be one of: ${allowed.join(", ")}` };
  }
  return null;
}

export function urlish(field: string, v: unknown): FieldError | null {
  if (typeof v !== "string" || v.trim() === "") return { field, message: "Required" };
  const raw = v.trim();
  try {
    // allow missing protocol by prefixing https:// for the check
    const test = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(test);
    if (!u.hostname.includes(".")) return { field, message: "Host is invalid" };
    return null;
  } catch {
    return { field, message: "Invalid URL" };
  }
}

export function validate<T>(checks: Array<FieldError | null>, data: T): ValidationResult<T> {
  const errors = checks.filter((e): e is FieldError => !!e);
  return errors.length ? { ok: false, errors } : { ok: true, data };
}
