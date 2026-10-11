import { LINE_BY_ID, type LineId } from '../content/upgrades';
import { SAVE_VERSION, newGame, type GameState } from './state';

const KEY = 'healthy-humans-save';

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed.version === 22) migrateUpgrades(parsed);
      if (parsed.version === 23) migrateLevels(parsed);
      if (parsed.version === SAVE_VERSION) return parsed;
    }
  } catch {
    // Storage blocked or corrupt. Start fresh.
  }
  return newGame();
}

export function saveGame(state: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked. The game still runs.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}

/** The old upgrades by line. Version 22 bought them in order, two per line. */
const OLD_LINES: Record<string, LineId> = {
  course: 'nudge',
  supervision: 'nudge',
  lunch: 'omsorgRate',
  avspasering: 'omsorgRate',
  office: 'omsorgCap',
  journal: 'omsorgCap',
  calendar: 'staff',
  handover: 'staff',
  report: 'grant',
  application: 'grant',
  commonRoom: 'house',
  garden: 'house',
};

/** Version 22 had two fixed upgrades per line. They are the first two steps. */
function migrateUpgrades(s: GameState) {
  const old = (s as unknown as { upgrades?: string[] }).upgrades ?? [];
  const count: Partial<Record<LineId, number>> = {};
  for (const id of old) {
    const line = OLD_LINES[id];
    if (line) count[line] = (count[line] ?? 0) + 1;
  }
  s.levels = {};
  for (const [line, n] of Object.entries(count) as [LineId, number][]) s.levels[line] = n;
  delete (s as unknown as { upgrades?: string[] }).upgrades;
  s.version = 24;
}

/** Version 23 had ten small levels to each step. */
function migrateLevels(s: GameState) {
  for (const [line, n] of Object.entries(s.levels) as [LineId, number][])
    s.levels[line] = Math.min(Math.round(n / 5), LINE_BY_ID[line].max ?? Infinity);
  s.version = 24;
}
