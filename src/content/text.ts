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
  plusKrPerW: (n: number) => `+${Math.round(n)} kr/w`,
  signedPerW: (n: number) => `${n >= 0 ? '+' : ''}${Math.round(n)}/w`,
  omsorg: (n: number) => `${n} omsorg`,
  level: (n: number) => `lvl ${n}`,
  /** One nudge's fill: whole segments, and a chance of one more. */
  fill: (whole: number, chance: number) =>
    chance > 0
      ? `${whole}, ${Math.round(chance * 100)}% chance of ${whole + 1}`
      : `${whole} ${plural(whole, 'segment', 'segments')}`,
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
  // TODO(Terje): placeholder results for milestone cards without their own lines.
  milestoneDone: (label: string) => `${label}: ✓`,
  milestoneFailed: (label: string) => `${label}: ✗`,
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
  /** What the next step gives. */
  effect: {
    nudge: (n: number) => `Each nudge fills ${n} segments`,
    omsorgRate: (x: string) => `Omsorg refills ×${x}`,
    omsorgCap: (n: number) => `Omsorg cap ${n}`,
    staff: (x: string) => `Staff nudge ×${x}`,
    grant: (x: string) => `Kommune grant ×${x}`,
    house: (x: string) => `Overskudd ×${x} for everyone`,
    // TODO(Terje): placeholder effect for the pay grade line.
    payGrade: (n: number) => `Wages can rise up to +${n} kr/week`,
  },
  // TODO(Terje): placeholder names for steps past the written ones, as "Garden III".
  repeatName: (label: string, n: number) => `${label} ${roman(n)}`,
};

function roman(n: number): string {
  const digits: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  for (const [v, d] of digits) while (n >= v) ((out += d), (n -= v));
  return out;
}

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
  // TODO(Terje): placeholder labels for the case worker.
  level: 'Level',
  caseworkCourse: 'Casework course',
  difficulty: 'Difficulty',
  reduced: (from: number, to: number) => `${from} → ${to}`,
  caseworkEffect: (from: number, to: number) => `Milestone difficulty ÷${from} → ÷${to}`,
  // TODO(Terje): placeholder labels for the intake course and its rules.
  intakeCourse: 'Intake course',
  intakeEffect: 'Admits to a free bed by your rule',
  intakeRule: { health: 'Lowest health', match: 'Best match', rich: 'Richest' },
  wageRaise: (kr: number) => `wage +${kr} kr/week`,
  payGradeFull: 'Pay grade full',
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
  go: 'Go',
  alone: 'alone',
  notNow: 'Not now',
  declined: 'Maybe another time.',
  continue: 'Continue',
  overskudd: 'Overskudd',
  // TODO(Terje): placeholder labels for the two sides of the odds bar.
  competence: 'Competence',
  difficulty: 'Difficulty',
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
  // TODO(Terje): the milestone name went out of this line with the hand of cards.
  milestone: (name: string, count: number) =>
    `${name} wants to try something big. ${count} milestones lead to a healthy human.`,
  // TODO(Terje): placeholder for the tip on the hand of milestone cards.
  hand: 'Pick one.',
  wagerTitle: 'Drag here',
  // TODO(Terje): the second sentence ("At X kr it is sure to work") went with the sure price.
  wager: 'Spend kroner on support to raise the odds.',
  go: (cost: number, name: string) =>
    `Go costs ${cost} overskudd (striped on the bar) and rolls the odds. "Not now" is free, and ${name} asks again later.`,
};
