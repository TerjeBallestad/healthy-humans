// Plays the game with a simple bot and prints the pace.
// Usage: npm run sim [-- --taps-per-second=1 --shop=0]
import { ACTIVITIES } from '../src/content/activities';
import { MAX_SKILL, NEED_THRESHOLD, SECONDS_PER_WEEK, trainCost } from '../src/content/tuning';
import { UPGRADES } from '../src/content/upgrades';
import { admit, buyBed, buyUpgrade, freeBed, nudge, train } from '../src/sim/actions';
import { canHire, hire } from '../src/sim/staff';
import { canBuy } from '../src/sim/institution';
import { accept, closeProposal, eligibleSubjects } from '../src/sim/proposals';
import { MILESTONES } from '../src/content/milestones';
import { activeNeeds, effort, unlockedActivities } from '../src/sim/selectors';
import { newGame, occupied } from '../src/sim/state';
import { tick } from '../src/sim/tick';
import { TICKS_PER_WEEK } from '../src/sim/time';

const arg = (name: string, fallback: number) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : fallback;
};

/** How fast a human taps, in taps per real second. */
const TAPS_PER_SECOND = arg('taps-per-second', 1);
const MAX_WEEKS = arg('weeks', 120);
/** 1 = the bot hires staff and buys upgrades. */
const SHOP = arg('shop', 1);
/** 1 = train the most-trained activity first (finish one), 0 = the cheapest first (spread). */
const DEEP = arg('deep', 0);
/** 1 = the bot buys beds and admits people. Stats still follow bed 0. */
const BEDS = arg('beds', 0);
const purchases: { what: string; tick: number }[] = [];
const REAL_SEC_PER_TICK = SECONDS_PER_WEEK / TICKS_PER_WEEK;

const s = newGame();
const r = s.beds[0]!;
let tapBudget = 0;
let ticksLow = 0;
let ticksEmpty = 0;
let ticksBusy = 0;
let taps = 0;
let trained = 0;
let milestoneSuccess = 0;
let milestoneFail = 0;
const unlockedAt: { rung: number; label: string; tick: number }[] = [];
let lastRung = r.unlockedRung;
const start = s.tick;

while (s.tick - start < MAX_WEEKS * TICKS_PER_WEEK) {
  tick(s);

  // Proposals: wager up to 250 kr when it can afford it.
  if (s.proposal) {
    accept(s, Math.min(250, Math.floor(s.budget / 50) * 50));
    if (s.proposal.outcome === 'success') milestoneSuccess++;
    else milestoneFail++;
    if (s.proposal.outcome === 'success') {
      purchases.push({
        what: `milestone ${s.beds[s.proposal.bed]?.name} ${s.beds[s.proposal.bed]?.milestones.at(-1)}`,
        tick: s.tick - start,
      });
    }
    closeProposal(s);
  }

  // Beds: buy when affordable, fill free beds at once.
  if (BEDS) {
    if (buyBed(s)) purchases.push({ what: `bed ${s.beds.length}`, tick: s.tick - start });
    if (freeBed(s) >= 0 && s.waiting.length > 0) admit(s, 0);
  }

  // Spend budget: staff first, then the cheapest upgrade.
  if (SHOP) {
    // Hire any candidate it can afford: a miljøarbeider first, then a coach.
    const order = s.candidates
      .map((c, i) => ({ c, i }))
      .sort((x, y) => (x.c.role === 'worker' ? 0 : 1) - (y.c.role === 'worker' ? 0 : 1));
    const pick = order.find(({ i }) => canHire(s, i));
    if (pick && hire(s, pick.i)) {
      const x = s.staff.at(-1)!;
      purchases.push({ what: `hire ${x.name} (${x.role})`, tick: s.tick - start });
    }
    const u = UPGRADES.find((x) => canBuy(s, x.id));
    if (u && !pick) {
      buyUpgrade(s, u.id);
      purchases.push({ what: u.label, tick: s.tick - start });
    }
  }
  // Overskudd: save for an open milestone, else train.
  for (const [bed, r] of occupied(s)) {
    if (eligibleSubjects(r).length > 0) continue;
    const cheapest = unlockedActivities(r)
      .filter((a) => r.skill[a.id] < MAX_SKILL)
      .sort(
        (a, b) =>
          (DEEP ? r.skill[b.id] - r.skill[a.id] : 0) ||
          trainCost(r.skill[a.id]) - trainCost(r.skill[b.id]) ||
          a.rung - b.rung,
      )[0];
    // Deep play waits for the next level of its chosen activity.
    if (cheapest && train(s, bed, cheapest.id)) trained++;
  }

  tapBudget += TAPS_PER_SECOND * REAL_SEC_PER_TICK;

  // Greedy bot: tap the open bar whose need is lowest, in any bed.
  const learning = occupied(s)
    .flatMap(([bed, x]) =>
      unlockedActivities(x)
        .filter((a) => effort(x, a.id) > 0 && x.bars[a.id] < effort(x, a.id))
        .map((a) => ({ bed, a, need: x.needs[a.trigger] })),
    )
    .sort((a, b) => a.need - b.need);
  for (const { bed, a } of learning) {
    while (tapBudget >= 1 && nudge(s, bed, a.id)) {
      tapBudget -= 1;
      taps++;
    }
  }
  tapBudget = Math.min(tapBudget, 1); // a human does not bank taps

  const needs = activeNeeds(r);
  if (needs.some((n) => r.needs[n] < NEED_THRESHOLD)) ticksLow++;
  if (needs.some((n) => r.needs[n] <= 0)) ticksEmpty++;
  if (r.current) ticksBusy++;

  if (r.unlockedRung !== lastRung) {
    for (let rung = lastRung + 1; rung <= r.unlockedRung; rung++) {
      const a = ACTIVITIES.find((x) => x.rung === rung)!;
      unlockedAt.push({ rung, label: a.label, tick: s.tick - start });
    }
    lastRung = r.unlockedRung;
  }
  if (r.milestones.length === MILESTONES.length) break;
}

const elapsed = s.tick - start;
const real = (ticks: number) => {
  const sec = Math.round(ticks * REAL_SEC_PER_TICK);
  return `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;
};
const week = (ticks: number) => `week ${(ticks / TICKS_PER_WEEK + 1).toFixed(1)}`;

console.log(`Bot taps up to ${TAPS_PER_SECOND}/s, shop ${SHOP ? 'on' : 'off'}. Real time at 1x.\n`);
for (const u of unlockedAt) {
  console.log(
    `  rung ${String(u.rung).padStart(2)} ${u.label.padEnd(16)} ${real(u.tick).padStart(8)}  (${week(u.tick)})`,
  );
}
if (purchases.length) console.log('');
for (const p of purchases) console.log(`  buy  ${p.what.padEnd(36)} ${real(p.tick).padStart(8)}`);
const done = r.milestones.length === MILESTONES.length;
console.log(
  `\n  ${done ? 'Work trial done' : 'Not finished'} at ${real(elapsed)} (${week(elapsed)})`,
);
console.log(
  `  Trained ${trained} levels. Milestones ${milestoneSuccess} ok / ${milestoneFail} failed`,
);
console.log(
  `  Any need below ${NEED_THRESHOLD}: ${((ticksLow / elapsed) * 100).toFixed(0)}% of the time`,
);
console.log(`  Busy with an activity: ${((ticksBusy / elapsed) * 100).toFixed(0)}% of the time`);
console.log(`  Any need at 0:     ${((ticksEmpty / elapsed) * 100).toFixed(0)}% of the time`);
console.log(
  `  Taps: ${taps} (${(taps / (elapsed * REAL_SEC_PER_TICK)).toFixed(2)} per real second)`,
);
console.log(`  Omsorg at cap:     ${s.omsorg.toFixed(0)} now`);
console.log(`  Waiting list:      ${s.waiting.length} now, ${s.lost} lost`);
