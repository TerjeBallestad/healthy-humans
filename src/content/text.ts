// Every player-facing line that is not part of another content file, grouped by where it shows.
// Lines with a name or a number are functions. The other content files (activities, needs,
// upgrades, milestones, archetypes, staff, traits, tiers) hold the rest of the text.

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Units and short labels used in many places. */
export const UNITS = {
  kr: (n: number) => `${n} kr`,
  krPerWeek: (n: number) => `${n} kr/week`,
  plusKrPerWeek: (n: number) => `+${n} kr/week`,
  plusKrPerWeekLong: (n: number) => `+${n} kr per week`,
  plusKrPerW: (n: number) => `+${n} kr/w`,
  signedPerW: (n: number) => `${n >= 0 ? '+' : ''}${n}/w`,
  omsorg: (n: number) => `${n} omsorg`,
  level: (n: number) => `lvl ${n}`,
  independent: 'independent',
  none: '–',
  close: 'Close',
  done: 'Done',
  levelOf: (n: number, of: number) => `Level ${n} of ${of}`,
};

/** Log lines written by the sim. */
export const LOG = {
  bedBought: 'A new bed is made up. It is empty.',
  upgradeBought: (label: string, note?: string) => (note ? `${label}. ${note}` : `${label}.`),
  discharged: (tier: string) => `Discharged: ${tier.toLowerCase()}.`,
  adOut: 'The job ad is out.',
  adAnswered: (n: number) => `${n} people answered the job ad.`,
  hired: (name: string, role: string) => `${name} starts as ${role.toLowerCase()}.`,
  turnedDown: 'Nobody was right for the job.',
  /** After the person's name. One line each time someone is lost, in turn. */
  lost: [
    'was taken in by the emergency ward. The case is closed.',
    'stopped answering the phone. The case is closed.',
    'was found by a neighbour. The case is closed.',
  ],
  easier: (activity: string) => `${activity}: a little easier now.`,
};

/** The resident's status line when nothing else applies. */
export const IDLE_LINE = 'Sitting on the sofa, phone in hand.';

export const TOP_BAR = {
  omsorg: 'Omsorg',
  play: 'Play',
  pause: 'Pause',
  helped: 'Helped',
  lost: 'Lost',
};

export const STRIP = {
  discharge: 'discharge',
  emptyBed: 'Empty bed',
  addBed: '+ Bed',
  skillUpReady: 'A skill-up is ready',
};

export const RESIDENT = {
  emptyBed: 'Empty bed',
  strain: (health: number, pct: number) =>
    `Arrived at health ${health}. Needs drop ${pct}% faster for now.`,
  overskudd: 'Overskudd',
  growing: (pct: number) => ` · growing at ${pct}% while a need is low`,
  milestones: 'Milestones: ',
  discharge: (tier: string) => `Discharge: ${tier.toLowerCase()}`,
  nextTier: (tier: string, tax: number, missing: string[]) =>
    `${tier} (+${tax} kr/week) needs ${missing.join(', ')}.`,
};

export const ACTIVITY_PANEL = {
  heading: 'Activities',
  inProgress: 'The activity in progress',
  becomesAutomatic: 'becomes automatic',
  nudges: (from: number, to: number) => `${from} → ${to} nudges`,
  trainTitle: (cost: number, effect: string) => `Train for ${cost} overskudd: ${effect}`,
  trainLabel: (activity: string, cost: number, effect: string) =>
    `Train ${activity} for ${cost} overskudd: ${effect}`,
};

export const WAITING = {
  heading: 'Venteliste',
  nobody: 'Nobody is waiting.',
  health: 'Health',
  admit: 'Legg inn →',
  nextReferral: (weeks: string) => `New referral in ${weeks} weeks.`,
  skillTitle: (activity: string, level: number, hard: number | null) =>
    `${activity}: ${level ? `lvl ${level}` : ''}${level && hard ? ', ' : ''}${hard ? `${hard}× effort` : ''}`,
};

/** The referral card. */
export const PATIENT = {
  heading: 'Henvisning',
  health: 'Health',
  drops: (perWeek: number) => `Drops ${perWeek} a week. `,
  lessThanAWeek: 'Less than a week left.',
  weeksLeft: (weeks: number) => `About ${weeks} weeks left.`,
  arrivalCost: (needLoss: number, strainPct: number) =>
    ` Moves in with needs ${needLoss} lower and ${strainPct}% faster decay.`,
  startsAt: 'Starts at',
  nudges: 'Nudges',
};

export const INSTITUTION = {
  discharged: 'Discharged',
  tax: 'Tax',
  staff: 'Staff',
  nobody: 'Nobody yet. It is just you.',
  nudgesInAll: (n: string) => `${n} nudges/s in all`,
  pickCandidate: 'Pick a candidate',
  deadline: 'Søknadsfrist',
  days: (n: number) => `${n} ${plural(n, 'dag', 'dager')}`,
  hire: 'Hire',
  training: 'Training',
  upgrades: 'Upgrades',
};

export const UPGRADES_MENU = {
  title: 'Upgrades',
  tabs: { you: 'Your work', staff: 'Staff', funding: 'Funding', house: 'House' },
  buy: 'Buy',
};

export const STAFF_TEXT = {
  nudge: 'Nudge',
  trainsTo: 'Trains to',
  times: (n: number) => `×${n}`,
  specialityExplain: (name: string, speciality: string, fill: number) =>
    `${name} works on ${speciality.toLowerCase()} first, and does ${speciality.toLowerCase()} activities at ${fill}× speed.`,
  mestring: 'Mestring',
  everyResident: 'Every resident',
  mestringValue: (pct: number) => `+${pct}% overskudd`,
  activities: (n: number) => `${n} ${plural(n, 'activity', 'activities')}`,
  hireTitle: 'Hire',
  pickOne: 'Pick one',
  hire: 'Hire',
  turnDown: 'Turn them all down',
  trainingLink: 'Training →',
  trainingTitle: 'Training',
  omsorg: 'Omsorg',
  mestringCourse: 'Mestring course',
  mestringEffect: (pct: number) => `Every resident: overskudd +${pct}%`,
  specialityCourse: (speciality: string) => `${speciality} course`,
  specialityEffect: (covers: string, fill: number) =>
    `${covers}: ×${fill} nudge, and first in line`,
  teach: (activity: string) => `Teach ${activity.toLowerCase()}`,
  upToIndependent: 'Up to independent',
  upTo: (level: string) => `Up to ${level}`,
  train: 'Train',
};

export const DISCHARGE = {
  heading: 'Vedtak om utskriving',
  resident: 'Resident',
  assessedAs: 'Assessed as',
  tax: 'Tax',
  taxValue: (n: number) => `+${n} kr per week, for the rest of the game`,
  ifYouWait: 'If you wait',
  better: (tier: string, tax: number, missing: string[]) =>
    `${tier.toLowerCase()} pays +${tax} kr per week. Needs ${missing.join(', ')}.`,
  firstInLine: 'First in line',
  firstHealth: (name: string, health: number) => `${name}, health ${health}. `,
  firstCost: (needLoss: number, strainPct: number) =>
    `Arrives with needs −${needLoss} and decay +${strainPct}%. `,
  worse: 'Every week makes it worse.',
  sign: 'Sign',
  notYet: 'Not yet',
  later: 'Some time later.',
  bedFree: 'The bed is free',
};

export const PROPOSAL = {
  chance: (pct: number) => `Chance ${pct}%`,
  krToSpend: 'Kroner to spend',
  sure: (kr: number) => `${kr} kr: sure`,
  go: 'Go',
  alone: 'alone',
  notNow: 'Not now',
  declined: 'Maybe another time.',
  continue: 'Continue',
  overskudd: 'Overskudd',
};

export const TOASTS = {
  upgradeReady: 'Upgrade ready',
  upgrade: (label: string, effect: string) => `${label}: ${effect.toLowerCase()}`,
  canHire: 'You can hire',
  adCost: (kr: number) => `A job ad costs ${kr} kr.`,
  upgradesReady: 'Upgrades ready',
  upgrades: (n: number) => `${n} upgrades you can buy.`,
};

/** Onboarding tips. Each has a short title and one to three sentences. */
export const TIPS = {
  ok: 'OK',
  clickHere: 'Click here',
  nudge: (name: string, noun: string) =>
    `${name} struggles with ${noun}. Use omsorg to nudge ${noun}. A full ring means ${name} does it when it is needed.`,
  omsorgTitle: 'Omsorg',
  omsorg: 'Your energy to care. Each nudge costs 1. It refills over time.',
  train: (noun: string) =>
    `Increase the independence of ${noun}. Each level halves the nudges required. It costs overskudd, which grows while the needs are green.`,
  hireTitle: 'Hire staff',
  hire: (kr: number) =>
    `A job ad costs ${kr} kr. A week later, candidates answer. Staff nudge for you.`,
  upgradesTitle: 'Upgrades',
  upgrades: 'Spend kroner to make your work, your staff and the house stronger.',
  bedTitle: 'One more bed',
  bed: (kr: number) => `Room for one more resident. Each bed adds ${kr} kr/week to the grant.`,
  admit: 'Choose who moves in. The worst health is on top. At 0 health the person is lost.',
  dischargeTitle: 'Ready to go home',
  discharge: (name: string) =>
    `${name} can go home now. A higher tier pays more tax, but the bed stays full while you wait.`,
  milestoneTitle: 'A milestone',
  milestone: (name: string, milestone: string, count: number) =>
    `${name} wants to try something big: ${milestone}. ${count} milestones lead to a healthy human.`,
  wagerTitle: 'Drag here',
  wager: (kr: number) =>
    `Spend kroner on support to raise the odds. At ${kr} kr it is sure to work.`,
  go: (cost: number, name: string) =>
    `Go costs ${cost} overskudd (striped on the bar) and rolls the odds. "Not now" is free, and ${name} asks again later.`,
};
