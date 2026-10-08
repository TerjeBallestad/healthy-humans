import { ACTIVITIES, ACTIVITY_BY_ID, type ActivityDef } from '../content/activities';
import { ARCHETYPE_BY_ID } from '../content/archetypes';
import { NEEDS } from '../content/needs';
import {
  AUTO_BELOW,
  COMPLETIONS_PER_LEVEL,
  LEARNING_WINDOW,
  MAX_SKILL,
  NEED_THRESHOLD,
  OVERSKUDD_CAP,
  OVERSKUDD_PER_HOUR,
  SPIRAL_PER_EMPTY_NEED,
  STAFF_NUDGES_PER_HOUR,
  WAIT_STRAIN_FADE_PER_DAY,
  WAITLIST_DAYS_PER_PERSON,
  barSize,
} from '../content/tuning';
import { netIncomePerDay, omsorgCap, omsorgPerHour } from './institution';
import { maybePropose } from './proposals';
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
  state.omsorg = Math.min(omsorgCap(state), state.omsorg + omsorgPerHour(state) / 60);
  state.budget += netIncomePerDay(state) / 1440;

  if (state.minute % (WAITLIST_DAYS_PER_PERSON * 1440) === 0) state.waiting.push(state.minute);

  const r = state.resident;
  r.strain = Math.max(0, r.strain - WAIT_STRAIN_FADE_PER_DAY / 1440);
  staffWork(state, r);
  decayNeeds(state, r);
  progressActivity(state, r);
  if (!r.current) startNextActivity(r);
  gainOverskudd(r);
  maybePropose(state);
}

/** Overskudd builds only while every active need is above the threshold. */
function gainOverskudd(r: Resident) {
  if (activeNeeds(r).some((n) => r.needs[n] < NEED_THRESHOLD)) return;
  r.overskudd = Math.min(OVERSKUDD_CAP, r.overskudd + OVERSKUDD_PER_HOUR / 60);
}

/** Staff put free nudges into the learning bar whose need is lowest. */
function staffWork(state: GameState, r: Resident) {
  if (state.staff.length === 0) return;
  state.staffCarry += (state.staff.length * STAFF_NUDGES_PER_HOUR) / 60;
  while (state.staffCarry >= 1) {
    const target = unlockedActivities(r)
      .filter((a) => {
        const size = barSize(r.skill[a.id]);
        return size > 0 && r.bars[a.id] < size;
      })
      .sort((x, y) => r.needs[x.trigger] - r.needs[y.trigger])[0];
    if (!target) {
      // Nothing to help with. Staff do not bank work.
      state.staffCarry = Math.min(state.staffCarry, 1);
      return;
    }
    r.bars[target.id] += 1;
    state.staffCarry -= 1;
  }
}

function decayNeeds(state: GameState, r: Resident) {
  const needs = activeNeeds(r);
  const current = r.current ? ACTIVITY_BY_ID[r.current.id] : null;
  const personal = ARCHETYPE_BY_ID[r.archetype].decay;
  // Each empty need speeds up the others.
  for (const id of needs) {
    if (current?.refills[id] !== undefined) continue;
    const empty = needs.filter((n) => n !== id && r.needs[n] <= 0).length;
    const base = (NEEDS[id].decayPerHour * (personal[id] ?? 1)) / 60;
    const rate = base * (1 + r.strain) * (1 + empty * SPIRAL_PER_EMPTY_NEED);
    const before = r.needs[id];
    r.needs[id] = Math.max(0, before - rate);
    if (before >= NEED_THRESHOLD && r.needs[id] < NEED_THRESHOLD) {
      log(state, NEEDS[id].lowLog.replace('{name}', r.name));
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
  levelUp(state, r, a);
}

/** Raise one skill level. Opens new rungs when the activity becomes automatic. */
export function levelUp(state: GameState, r: Resident, a: ActivityDef) {
  if (r.skill[a.id] >= MAX_SKILL) return;
  r.xp[a.id] = 0;
  r.skill[a.id] += 1;
  // Clicks already in the bar carry over, capped at the new size.
  r.bars[a.id] = Math.min(r.bars[a.id], barSize(r.skill[a.id]));
  if (r.skill[a.id] < MAX_SKILL) {
    log(state, `${a.label}: a little easier now.`);
    return;
  }
  log(state, a.independent);
  for (const opened of fillLearningWindow(r)) log(state, opened.appears);
}

/** Open new rungs until the resident is learning LEARNING_WINDOW activities. Returns the new ones. */
export function fillLearningWindow(r: Resident): ActivityDef[] {
  const opened: ActivityDef[] = [];
  const learning = () => unlockedActivities(r).filter((a) => r.skill[a.id] < MAX_SKILL).length;
  while (learning() < LEARNING_WINDOW) {
    const next = ACTIVITIES.find((n) => n.rung === r.unlockedRung + 1);
    if (!next) break;
    r.unlockedRung = next.rung;
    opened.push(next);
  }
  return opened;
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
