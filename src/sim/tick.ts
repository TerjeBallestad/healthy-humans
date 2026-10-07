import { ACTIVITIES, ACTIVITY_BY_ID, type ActivityDef } from '../content/activities';
import { NEEDS } from '../content/needs';
import {
  AUTO_BELOW,
  COMPLETIONS_PER_LEVEL,
  MAX_SKILL,
  NEED_THRESHOLD,
  OMSORG_CAP,
  OMSORG_PER_HOUR,
  SPIRAL_PER_EMPTY_NEED,
  barSize,
} from '../content/tuning';
import { activeNeeds, unlockedActivities } from './selectors';
import type { GameState, Resident } from './state';

const LOG_LIMIT = 30;

export function log(state: GameState, text: string) {
  state.log.unshift({ minute: state.minute, text });
  if (state.log.length > LOG_LIMIT) state.log.length = LOG_LIMIT;
}

/** Advance the sim by one game minute. */
export function tickMinute(state: GameState) {
  state.minute += 1;
  state.omsorg = Math.min(OMSORG_CAP, state.omsorg + OMSORG_PER_HOUR / 60);

  const r = state.resident;
  decayNeeds(state, r);
  progressActivity(state, r);
  if (!r.current) startNextActivity(r);
}

function decayNeeds(state: GameState, r: Resident) {
  const needs = activeNeeds(r);
  const current = r.current ? ACTIVITY_BY_ID[r.current.id] : null;
  // Each empty need speeds up the others.
  for (const id of needs) {
    if (current?.refills[id] !== undefined) continue;
    const empty = needs.filter((n) => n !== id && r.needs[n] <= 0).length;
    const rate = (NEEDS[id].decayPerHour / 60) * (1 + empty * SPIRAL_PER_EMPTY_NEED);
    const before = r.needs[id];
    r.needs[id] = Math.max(0, before - rate);
    if (before >= NEED_THRESHOLD && r.needs[id] < NEED_THRESHOLD) {
      log(state, `${r.name} is ${NEEDS[id].lowState}.`);
    }
  }
}

function progressActivity(state: GameState, r: Resident) {
  if (!r.current) return;
  const a = ACTIVITY_BY_ID[r.current.id];
  // Refills arrive spread over the duration.
  for (const [id, amount] of Object.entries(a.refills)) {
    const need = id as keyof typeof r.needs;
    r.needs[need] = Math.min(100, r.needs[need] + amount / a.duration);
  }
  r.current.remaining -= 1;
  if (r.current.remaining > 0) return;
  r.current = null;
  log(state, a.done);
  gainSkill(state, r, a);
}

function gainSkill(state: GameState, r: Resident, a: ActivityDef) {
  if (r.skill[a.id] >= MAX_SKILL) return;
  r.xp[a.id] += 1;
  if (r.xp[a.id] < COMPLETIONS_PER_LEVEL) return;
  r.xp[a.id] = 0;
  r.skill[a.id] += 1;
  // Clicks already in the bar carry over, capped at the new size.
  r.bars[a.id] = Math.min(r.bars[a.id], barSize(r.skill[a.id]));
  if (r.skill[a.id] < MAX_SKILL) {
    log(state, `${a.label}: a little easier now.`);
    return;
  }
  log(state, a.independent);
  // The newest rung going automatic opens the next one.
  const next = ACTIVITIES.find((n) => n.rung === r.unlockedRung + 1);
  if (a.rung === r.unlockedRung && next) {
    r.unlockedRung = next.rung;
    log(state, next.appears);
  }
}

function startNextActivity(r: Resident) {
  const open = unlockedActivities(r);
  // Nudged activities first, in ladder order.
  const nudged = open.find((a) => {
    const size = barSize(r.skill[a.id]);
    return size > 0 && r.bars[a.id] >= size;
  });
  if (nudged) {
    r.bars[nudged.id] = 0;
    r.current = { id: nudged.id, remaining: nudged.duration };
    return;
  }
  // Then automatic activities, for the lowest need under the trigger line.
  const auto = open
    .filter((a) => barSize(r.skill[a.id]) === 0 && r.needs[a.trigger] < AUTO_BELOW)
    .sort((x, y) => r.needs[x.trigger] - r.needs[y.trigger])[0];
  if (auto) r.current = { id: auto.id, remaining: auto.duration };
}
