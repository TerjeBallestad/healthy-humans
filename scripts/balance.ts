// Plays the game with a simple bot and prints the pace.
// Usage: npm run sim [-- --taps-per-second=1 --shop=0]
import { ACTIVITIES } from '../src/content/activities';
import { NEED_THRESHOLD, SECONDS_PER_WEEK, barSize } from '../src/content/tuning';
import { UPGRADES } from '../src/content/upgrades';
import { buyUpgrade, hire, nudge } from '../src/sim/actions';
import { canBuy, canHire } from '../src/sim/institution';
import { accept, canSupport, closeProposal } from '../src/sim/proposals';
import { MILESTONES } from '../src/content/milestones';
import { activeNeeds, unlockedActivities } from '../src/sim/selectors';
import { newGame } from '../src/sim/state';
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
const purchases: { what: string; tick: number }[] = [];
const REAL_SEC_PER_TICK = SECONDS_PER_WEEK / TICKS_PER_WEEK;

const s = newGame();
const r = s.resident;
let tapBudget = 0;
let ticksLow = 0;
let ticksEmpty = 0;
let ticksBusy = 0;
let taps = 0;
let trySuccess = 0;
let tryFail = 0;
let milestoneSuccess = 0;
let milestoneFail = 0;
const unlockedAt: { rung: number; label: string; tick: number }[] = [];
let lastRung = r.unlockedRung;
const start = s.tick;

while (s.tick - start < MAX_WEEKS * TICKS_PER_WEEK) {
  tick(s);

  // Proposals: accept with some help when it can afford it.
  if (s.proposal) {
    const step = [1, 0].find((i) => canSupport(s, i))!;
    const kind = s.proposal.subject.kind;
    accept(s, step);
    if (s.proposal.outcome === 'success') kind === 'try' ? trySuccess++ : milestoneSuccess++;
    else kind === 'try' ? tryFail++ : milestoneFail++;
    if (kind === 'milestone' && s.proposal.outcome === 'success') {
      purchases.push({
        what: `milestone ${s.resident.milestones.at(-1)}`,
        tick: s.tick - start,
      });
    }
    closeProposal(s);
  }

  // Spend budget: staff first, then the cheapest upgrade.
  if (SHOP) {
    if (canHire(s)) {
      hire(s);
      purchases.push({ what: `hire ${s.staff.at(-1)}`, tick: s.tick - start });
    }
    const u = UPGRADES.find((x) => canBuy(s, x.id));
    if (u && !canHire(s)) {
      buyUpgrade(s, u.id);
      purchases.push({ what: u.label, tick: s.tick - start });
    }
  }
  tapBudget += TAPS_PER_SECOND * REAL_SEC_PER_TICK;

  // Greedy bot: tap the learning activity whose need is lowest.
  const learning = unlockedActivities(r)
    .filter((a) => barSize(r.skill[a.id]) > 0 && r.bars[a.id] < barSize(r.skill[a.id]))
    .sort((a, b) => r.needs[a.trigger] - r.needs[b.trigger]);
  for (const a of learning) {
    while (tapBudget >= 1 && nudge(s, a.id)) {
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
  `  Proposals: try ${trySuccess} ok / ${tryFail} failed, milestones ${milestoneSuccess} ok / ${milestoneFail} failed`,
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
