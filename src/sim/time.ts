const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function dayIndex(minute: number): number {
  return Math.floor(minute / 1440);
}

export function formatClock(minute: number): string {
  const m = Math.floor(minute) % 1440;
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDate(minute: number): string {
  const day = dayIndex(minute);
  return `Week ${Math.floor(day / 7) + 1}, ${DAYS[day % 7]}`;
}
