// Timezone-safe date helpers.
// Every "YYYY-MM-DD" / "YYYY-MM" string here reflects the user's LOCAL calendar
// day, not UTC. Using toISOString() for the date part causes an off-by-one for
// UTC+ users in the early-morning window (e.g. UTC+7 00:00–07:00). See
// .sdd/specs/feat-timezone-safety/SPEC.md.

const pad = (n: number): string => String(n).padStart(2, '0');

/** Format a Date into a local YYYY-MM-DD string. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local calendar date as YYYY-MM-DD. */
export function getTodayDateString(): string {
  return toISODate(new Date());
}

/** Current local year-month as YYYY-MM. */
export function getCurrentYearMonth(): string {
  return getTodayDateString().slice(0, 7);
}

/**
 * Add `days` (may be negative) to a YYYY-MM-DD string, returning YYYY-MM-DD.
 * Parses at local midnight so month/year/DST boundaries resolve correctly.
 */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
}
