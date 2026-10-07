import { signal } from '@preact/signals';
import { REAL_SECONDS_PER_DAY } from './content/tuning';
import { clearSave, loadGame, saveGame } from './sim/save';
import { newGame, type GameState } from './sim/state';
import { tickMinute } from './sim/tick';

const GAME_MINUTES_PER_REAL_MS = 1440 / (REAL_SECONDS_PER_DAY * 1000);
/** Longest real frame we simulate. Longer gaps (tab hidden) are dropped. */
const MAX_FRAME_MS = 250;
const SAVE_EVERY_MS = 5000;

let state: GameState = loadGame();

/** Bumped whenever the state changes. Components read it to subscribe. */
const version = signal(0);

export function useGame(): GameState {
  void version.value;
  return state;
}

/** Run a mutation on the state and re-render. */
export function act(fn: (s: GameState) => unknown) {
  fn(state);
  version.value++;
}

export function resetGame() {
  clearSave();
  state = newGame();
  version.value++;
}

let carry = 0;
let last = performance.now();
let lastSave = last;

function frame(now: number) {
  const dt = Math.min(now - last, MAX_FRAME_MS);
  last = now;
  carry += dt * state.speed * GAME_MINUTES_PER_REAL_MS;
  let ticks = 0;
  while (carry >= 1) {
    tickMinute(state);
    carry -= 1;
    ticks++;
  }
  if (ticks > 0) version.value++;
  if (now - lastSave > SAVE_EVERY_MS) {
    saveGame(state);
    lastSave = now;
  }
  requestAnimationFrame(frame);
}

export function startLoop() {
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveGame(state);
  });
  window.addEventListener('pagehide', () => saveGame(state));
}
