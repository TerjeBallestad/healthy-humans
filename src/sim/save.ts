import { SAVE_VERSION, newGame, type GameState } from './state';

const KEY = 'healthy-humans-save';

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
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
