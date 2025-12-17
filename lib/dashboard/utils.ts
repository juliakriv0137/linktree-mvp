/**
 * Dashboard-level utilities.
 * Keep this file framework-agnostic (no React, no Next).
 */

export function safeTrim(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function clampInt(n: number, min: number, max: number): number {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

/**
 * Anchor ids: letters, numbers, dash, underscore.
 * Also ensures it doesn't start with a number (HTML id can, but anchors are nicer this way).
 */
export function normalizeAnchorId(input: unknown): string {
  const raw = safeTrim(input).toLowerCase();
  const cleaned = raw
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleaned) return "";
  if (/^[0-9]/.test(cleaned)) return `s-${cleaned}`;
  return cleaned;
}

/**
 * Accepts hex colors like #RRGGBB or #RGB. Returns normalized #RRGGBB or null.
 */
export function normalizeHexOrNull(input: unknown): string | null {
  const v = safeTrim(input);
  if (!v) return null;

  const s = v.startsWith("#") ? v : `#${v}`;
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();

  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return null;
}

/**
 * Best-effort url normalize for button/link fields.
 * - empty -> ""
 * - if starts with # -> keep (anchor)
 * - if already has scheme -> keep
 * - otherwise add https://
 */
export function normalizeUrl(input: unknown): string {
  const v = safeTrim(input);
  if (!v) return "";
  if (v.startsWith("#")) return v;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v)) return v;
  return `https://${v}`;
}

/**
 * Safe JSON parse that never throws.
 */
export function tryParseJson<T = any>(input: unknown): T | null {
  if (typeof input !== "string") return null;
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}
