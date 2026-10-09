import { ACTIVITIES, type ActivityId } from '../content/activities';
import { NEED_ORDER, type NeedId } from '../content/needs';
import {
  CANDIDATES,
  COACH_SHARE,
  COACH_TRAIN_COST,
  MAX_STAFF,
  ROLES,
  SPECIALITY_TRAIN_COST,
  STAFF_NAMES,
  type StaffRole,
} from '../content/staff';
import { MAX_SKILL } from '../content/tuning';
import { canAffordWage, hireCost } from './institution';
import { random } from './rng';
import type { GameState, Staff } from './state';
import { log } from './tick';

const pick = <T>(s: GameState, list: readonly T[]): T => list[Math.floor(random(s) * list.length)]!;

/** A new person for the hiring list, with a role and a rolled sheet. Advances the seed. */
function rollCandidate(s: GameState, taken: Set<string>): Staff {
  const name = pick(
    s,
    STAFF_NAMES.filter((n) => !taken.has(n)),
  );
  taken.add(name);
  const role: StaffRole = random(s) < COACH_SHARE ? 'coach' : 'worker';
  const staff: Staff = { name, role, specialities: [], coaching: {}, carry: 0 };
  if (role === 'worker') {
    staff.specialities.push(pick(s, NEED_ORDER));
    return staff;
  }
  // Three activities at lvl 1. Sometimes one goes higher.
  const acts = [...ACTIVITIES].sort(() => random(s) - 0.5).slice(0, 3);
  for (const a of acts) staff.coaching[a.id] = 1;
  const roll = random(s);
  if (roll < 0.1) staff.coaching[acts[0]!.id] = 3;
  else if (roll < 0.4) staff.coaching[acts[0]!.id] = 2;
  return staff;
}

/** A new hiring list. Names already in the house are not used again. */
export function rollCandidates(s: GameState) {
  const taken = new Set(s.staff.map((x) => x.name));
  s.candidates = Array.from({ length: CANDIDATES }, () => rollCandidate(s, taken));
}

export function canHire(s: GameState, index: number): boolean {
  const c = s.candidates[index];
  return !!c && s.staff.length < MAX_STAFF && s.budget >= hireCost(s) && canAffordWage(s, c.role);
}

export function hire(s: GameState, index: number): boolean {
  if (!canHire(s, index)) return false;
  s.budget -= hireCost(s);
  const [person] = s.candidates.splice(index, 1);
  s.staff.push(person!);
  log(s, `${person!.name} starts as ${ROLES[person!.role].label.toLowerCase()}.`);
  return true;
}

/** The highest level any coach in the house can train an activity to. */
export function coachLevel(s: GameState, id: ActivityId): number {
  return Math.max(0, ...s.staff.map((x) => x.coaching[id] ?? 0));
}

export function canTrainSpeciality(s: GameState, index: number, need: NeedId): boolean {
  const x = s.staff[index];
  return (
    !!x &&
    x.role === 'worker' &&
    !x.specialities.includes(need) &&
    s.omsorg >= SPECIALITY_TRAIN_COST
  );
}

/** Spend omsorg to teach a miljøarbeider one more speciality. */
export function trainSpeciality(s: GameState, index: number, need: NeedId): boolean {
  if (!canTrainSpeciality(s, index, need)) return false;
  s.omsorg -= SPECIALITY_TRAIN_COST;
  s.staff[index]!.specialities.push(need);
  return true;
}

/** Omsorg to teach a coach the next level of an activity. Infinity at the top. */
export function coachTrainCost(x: Staff, id: ActivityId): number {
  return COACH_TRAIN_COST[x.coaching[id] ?? 0] ?? Infinity;
}

export function canTrainCoach(s: GameState, index: number, id: ActivityId): boolean {
  const x = s.staff[index];
  return (
    !!x &&
    x.role === 'coach' &&
    (x.coaching[id] ?? 0) < MAX_SKILL &&
    s.omsorg >= coachTrainCost(x, id)
  );
}

/** Spend omsorg to teach a coach the next level of an activity. */
export function trainCoach(s: GameState, index: number, id: ActivityId): boolean {
  if (!canTrainCoach(s, index, id)) return false;
  const x = s.staff[index]!;
  s.omsorg -= coachTrainCost(x, id);
  x.coaching[id] = (x.coaching[id] ?? 0) + 1;
  return true;
}
