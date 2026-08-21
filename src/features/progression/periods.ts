/**
 * Period keys for anything that resets on a clock (docs/ARCHITECTURE.md §24).
 *
 * Everything is UTC. A local-time boundary would mean a player who travels, or
 * whose phone changes timezone, either loses a day's quests or gets two — and
 * because the server will eventually be the authority here, the client has to
 * agree with it rather than with the handset.
 */

export type QuestPeriod = 'daily' | 'weekly';

/** `YYYY-MM-DD` in UTC. */
export const dayKey = (date: Date = new Date()): string => date.toISOString().slice(0, 10);

/**
 * ISO-8601 week key, `YYYY-Www`.
 *
 * ISO weeks start on Monday and belong to the year containing their Thursday,
 * which is why this pivots on Thursday rather than counting from January 1st:
 * the last days of December frequently belong to week 1 of the next year, and
 * a naive count hands those players a second "new week" three days early.
 */
export function isoWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = d.getUTCDay() || 7; // Monday = 1 … Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export const periodKey = (period: QuestPeriod, date: Date = new Date()): string =>
  period === 'daily' ? dayKey(date) : isoWeekKey(date);

/** Milliseconds until the current period ends — drives the "resets in" copy. */
export function msUntilPeriodEnd(period: QuestPeriod, date: Date = new Date()): number {
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  );
  if (period === 'weekly') {
    // Advance to the next Monday 00:00 UTC.
    const dayNumber = date.getUTCDay() || 7;
    end.setUTCDate(end.getUTCDate() + (7 - dayNumber));
  }
  return Math.max(0, end.getTime() - date.getTime());
}

/** "6h" / "2d" — short enough for a chip, honest enough to plan around. */
export function formatResetIn(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  if (hours >= 1) return `${hours}h`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m`;
}
