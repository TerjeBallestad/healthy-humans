import { SECONDS_PER_WEEK } from '../content/tuning';

// Two clocks, as in Game Dev Story. Activities run in real seconds. The calendar runs in
// weeks, far faster than life. The sim counts ticks: 60 per real second at 1x.
export const TICKS_PER_SECOND = 60;
export const TICKS_PER_WEEK = SECONDS_PER_WEEK * TICKS_PER_SECOND;
const WEEKS_PER_MONTH = 4;
const MONTHS_PER_YEAR = 12;

/** Whole weeks since the start. */
export function weekIndex(tick: number): number {
  return Math.floor(tick / TICKS_PER_WEEK);
}

/** "Y1 M4 W2". */
export function formatDate(tick: number): string {
  const w = weekIndex(tick);
  const year = Math.floor(w / (WEEKS_PER_MONTH * MONTHS_PER_YEAR)) + 1;
  const month = (Math.floor(w / WEEKS_PER_MONTH) % MONTHS_PER_YEAR) + 1;
  return `Y${year} M${month} W${(w % WEEKS_PER_MONTH) + 1}`;
}
