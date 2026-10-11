import { ACTIVITIES, type ActivityId } from '../content/activities';
import { NEED_ORDER, type NeedId } from '../content/needs';
import {
  AD_WEEKS,
  CANDIDATES,
  CASEWORK_COST_AT_50,
  CASEWORK_COST_GROWTH,
  CASEWORK_STEP,
  CASEWORKER_SKILL_MAX,
  CASEWORKER_SKILL_MIN,
  COACH_TRAIN_COST,
  MAX_STAFF,
  MESTRING_TRAIN_COST,
  ROLES,
  SPECIALITY_TRAIN_COST,
  STAFF_FACES,
  STAFF_NAMES,
  type StaffRole,
} from '../content/staff';
import { MAX_SKILL } from '../content/tuning';
import { canAffordWage, hireCost } from './institution';
import { random } from './rng';
import type { GameState, Staff } from './state';
import { TICKS_PER_WEEK } from './time';
import { log } from './tick';
import { LOG } from '../content/text';

const pick = <T>(s: GameState, list: readonly T[]): T => list[Math.floor(random(s) * list.length)]!;

/** A new person for the hiring list, with a role and a rolled sheet. Advances the seed. */
function rollCandidate(s: GameState, taken: Set<string>, role: StaffRole): Staff {
  const name = pick(
    s,
    STAFF_NAMES.filter((n) => !taken.has(n)),
  );
  taken.add(name);
  const face = pick(s, STAFF_FACES);
  const staff: Staff = { name, face, role, specialities: [], coaching: {}, carry: 0 };
  if (role === 'worker') {
    staff.specialities.push(pick(s, NEED_ORDER));
    return staff;
  }
  if (role === 'caseworker') {
    const span = CASEWORKER_SKILL_MAX - CASEWORKER_SKILL_MIN;
    staff.skill = CASEWORKER_SKILL_MIN + Math.round(random(s) * span);
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

/** The answers to a job ad: all in the role it asks for. Names already in the house are not used again. */
export function rollCandidates(s: GameState, role: StaffRole) {
  const taken = new Set(s.staff.map((x) => x.name));
  s.candidates = Array.from({ length: CANDIDATES }, () => rollCandidate(s, taken, role));
}

/** A job ad is possible when no other ad is open and there is a free office slot. */
export function canPostAd(s: GameState): boolean {
  return (
    s.adReady === null &&
    s.candidates.length === 0 &&
    s.staff.length < MAX_STAFF &&
    s.budget >= hireCost(s)
  );
}

/** Pay for a job ad for one role. The candidates show up AD_WEEKS later. */
export function postAd(s: GameState, role: StaffRole): boolean {
  if (!canPostAd(s)) return false;
  s.budget -= hireCost(s);
  s.adReady = s.tick + AD_WEEKS * TICKS_PER_WEEK;
  s.adRole = role;
  log(s, LOG.adOut);
  return true;
}

/** Called each tick: the candidates arrive when the ad is ready. */
export function checkAd(s: GameState) {
  if (s.adReady === null || s.tick < s.adReady) return;
  s.adReady = null;
  rollCandidates(s, s.adRole ?? 'worker');
  log(s, LOG.adAnswered(s.candidates.length));
}

/** Picking a candidate costs no fee, only the wage. The ad closes. */
export function canHire(s: GameState, index: number): boolean {
  const c = s.candidates[index];
  return !!c && s.staff.length < MAX_STAFF && canAffordWage(s, c.role);
}

export function hire(s: GameState, index: number): boolean {
  if (!canHire(s, index)) return false;
  const person = s.candidates[index]!;
  s.candidates = [];
  s.staff.push(person);
  log(s, LOG.hired(person.name, ROLES[person.role].label));
  return true;
}

/** Say no to everyone. The ad closes, and the fee is gone. */
export function turnDown(s: GameState) {
  if (s.candidates.length === 0) return;
  s.candidates = [];
  log(s, LOG.turnedDown);
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

export function canTrainMestring(s: GameState, index: number): boolean {
  const x = s.staff[index];
  return !!x && !x.mestring && s.omsorg >= MESTRING_TRAIN_COST;
}

/** Spend omsorg on the mestring course: more overskudd for every resident. */
export function trainMestring(s: GameState, index: number): boolean {
  if (!canTrainMestring(s, index)) return false;
  s.omsorg -= MESTRING_TRAIN_COST;
  s.staff[index]!.mestring = true;
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

/** The case worker with the highest skill, or undefined before the first one is hired. */
export function bestCaseWorker(s: GameState): Staff | undefined {
  return s.staff
    .filter((x) => x.role === 'caseworker')
    .sort((a, b) => (b.skill ?? 0) - (a.skill ?? 0))[0];
}

/** Kroner for the next casework course. Infinity at 100. */
export function caseworkCost(x: Staff): number {
  const skill = x.skill ?? 0;
  if (skill >= 100) return Infinity;
  return Math.round(CASEWORK_COST_AT_50 * CASEWORK_COST_GROWTH ** ((skill - 50) / CASEWORK_STEP));
}

export function canTrainCasework(s: GameState, index: number): boolean {
  const x = s.staff[index];
  return !!x && x.role === 'caseworker' && s.budget >= caseworkCost(x);
}

/** Spend kroner on the casework course: CASEWORK_STEP more skill, up to 100. */
export function trainCasework(s: GameState, index: number): boolean {
  if (!canTrainCasework(s, index)) return false;
  const x = s.staff[index]!;
  s.budget -= caseworkCost(x);
  x.skill = Math.min(100, (x.skill ?? 0) + CASEWORK_STEP);
  return true;
}
