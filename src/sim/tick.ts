import { ACTIVITIES, ACTIVITY_BY_ID, type ActivityDef } from '../content/activities';
import { ARCHETYPES, ARCHETYPE_BY_ID } from '../content/archetypes';
import { NEEDS } from '../content/needs';
import {
  READY_BELOW,
  LEARNING_WINDOW,
  MAX_SKILL,
  NEED_THRESHOLD,
  OVERSKUDD_CAP,
  OVERSKUDD_PER_SECOND,
  SPIRAL_PER_EMPTY_NEED,
  STAFF_NUDGES_PER_SECOND,
  WAIT_STRAIN_FADE_PER_WEEK,
  WAITLIST_WEEKS_PER_PERSON,
  barSize,
} from '../content/tuning';
import { netIncomePerWeek, omsorgCap, omsorgPerSecond } from './institution';
import { maybePropose } from './proposals';
import { activeNeeds, readyQueue, unlockedActivities } from './selectors';
import { occupied, type GameState, type Resident } from './state';
import { TICKS_PER_SECOND, TICKS_PER_WEEK } from './time';

const LOG_LIMIT = 30;

/** Add a log line. Pass who when the line is about one resident. */
export function log(state: GameState, text: string, who?: string) {
  state.log.unshift({ tick: state.tick, text, ...(who && { who }) });
  if (state.log.length > LOG_LIMIT) state.log.length = LOG_LIMIT;
}

/** Advance the sim by one tick: 1/60 of a real second at 1x. */
export function tick(state: GameState) {
  state.tick += 1;
  state.omsorg = Math.min(
    omsorgCap(state),
    state.omsorg + omsorgPerSecond(state) / TICKS_PER_SECOND,
  );
  state.budget += netIncomePerWeek(state) / TICKS_PER_WEEK;

  if (state.tick % (WAITLIST_WEEKS_PER_PERSON * TICKS_PER_WEEK) === 0) {
    const a = ARCHETYPES[state.nextArchetype % ARCHETYPES.length]!;
    state.waiting.push({ archetype: a.id, joined: state.tick });
    state.nextArchetype += 1;
  }

  staffWork(state);
  for (const [, r] of occupied(state)) {
    r.strain = Math.max(0, r.strain - WAIT_STRAIN_FADE_PER_WEEK / TICKS_PER_WEEK);
    decayNeeds(state, r);
    progressActivity(state, r);
    if (!r.current) startNextActivity(r);
    gainOverskudd(r);
  }
  maybePropose(state);
}

/** Overskudd builds in proportion to the share of active needs above the threshold. */
function gainOverskudd(r: Resident) {
  const needs = activeNeeds(r);
  const green = needs.filter((n) => r.needs[n] >= NEED_THRESHOLD).length / needs.length;
  r.overskudd = Math.min(
    OVERSKUDD_CAP,
    r.overskudd + (green * OVERSKUDD_PER_SECOND) / TICKS_PER_SECOND,
  );
}

/** Staff put free nudges into the open bar with the lowest need, across all beds. */
function staffWork(state: GameState) {
  if (state.staff.length === 0) return;
  state.staffCarry += (state.staff.length * STAFF_NUDGES_PER_SECOND) / TICKS_PER_SECOND;
  while (state.staffCarry >= 1) {
    const target = occupied(state)
      .flatMap(([, r]) =>
        unlockedActivities(r)
          .filter((a) => {
            const size = barSize(r.skill[a.id]);
            return size > 0 && r.bars[a.id] < size;
          })
          .map((a) => ({ r, a, need: r.needs[a.trigger] })),
      )
      .sort((x, y) => x.need - y.need)[0];
    if (!target) {
      // Nothing to help with. Staff do not bank work.
      state.staffCarry = Math.min(state.staffCarry, 1);
      return;
    }
    target.r.bars[target.a.id] += 1;
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
    const base = (NEEDS[id].decayPerSecond * (personal[id] ?? 1)) / TICKS_PER_SECOND;
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
    r.needs[need] = Math.min(100, r.needs[need] + amount / (a.duration * TICKS_PER_SECOND));
  }
  r.current.remaining -= 1;
  if (r.current.remaining > 0) return;
  r.current = null;
  log(state, a.done, r.name);
}

/** Raise one skill level. Opens new rungs when the activity becomes automatic. */
export function levelUp(state: GameState, r: Resident, a: ActivityDef) {
  if (r.skill[a.id] >= MAX_SKILL) return;
  r.skill[a.id] += 1;
  // Clicks already in the bar carry over, capped at the new size.
  r.bars[a.id] = Math.min(r.bars[a.id], barSize(r.skill[a.id]));
  if (r.skill[a.id] < MAX_SKILL) {
    log(state, `${a.label}: a little easier now.`, r.name);
    return;
  }
  log(state, a.independent, r.name);
  for (const opened of fillLearningWindow(r)) log(state, opened.appears, r.name);
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
  const next = readyQueue(r).find((a) => r.needs[a.trigger] < READY_BELOW);
  if (!next) return;
  // A nudged activity uses up its bar. An automatic one has no bar.
  r.bars[next.id] = 0;
  r.current = { id: next.id, remaining: next.duration * TICKS_PER_SECOND };
}
