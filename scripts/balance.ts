// Plays the game with a simple bot and prints the pace.
// Usage: npm run sim [-- --taps-per-second=1 --shop=0]
import { ACTIVITIES } from '../src/content/activities';
import { NEED_THRESHOLD, REAL_SECONDS_PER_DAY, barSize } from '../src/content/tuning';
import { UPGRADES } from '../src/content/upgrades';
import { buyUpgrade, hire, nudge } from '../src/sim/actions';
import { canBuy, canHire } from '../src/sim/institution';
import { accept, canSupport, closeProposal } from '../src/sim/proposals';
import { MILESTONES } from '../src/content/milestones';
import { activeNeeds, unlockedActivities } from '../src/sim/selectors';
import { newGame } from '../src/sim/state';
import { tickMinute } from '../src/sim/tick';

const arg = (name: string, fallback: number) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : fallback;
};

/** How fast a human taps, in taps per real second. */
const TAPS_PER_SECOND = arg('taps-per-second', 1);
const MAX_DAYS = arg('days', 120);
/** 1 = the bot hires staff and buys upgrades. */
const SHOP = arg('shop', 1);
const purchases: { what: string; minute: number }[] = [];
const REAL_SEC_PER_MINUTE = REAL_SECONDS_PER_DAY / 1440;

const s = newGame();
const r = s.resident;
let tapBudget = 0;
let minutesLow = 0;
let minutesEmpty = 0;
let taps = 0;
let trySuccess = 0;
let tryFail = 0;
let milestoneSuccess = 0;
let milestoneFail = 0;
const unlockedAt: { rung: number; label: string; minute: number }[] = [];
let lastRung = r.unlockedRung;
const start = s.minute;

while (s.minute - start < MAX_DAYS * 1440) {
  tickMinute(s);

  // Proposals: accept with the most support the bot can afford.
  if (s.proposal) {
    const step = [2, 1, 0].find((i) => canSupport(s, i))!;
    const kind = s.proposal.subject.kind;
    accept(s, step);
    if (s.proposal.outcome === 'success') kind === 'try' ? trySuccess++ : milestoneSuccess++;
    else kind === 'try' ? tryFail++ : milestoneFail++;
    if (kind === 'milestone' && s.proposal.outcome === 'success') {
      purchases.push({ what: `milestone ${s.resident.milestones.at(-1)}`, minute: s.minute - start });
    }
    closeProposal(s);
  }

  // Spend budget: staff first, then the cheapest upgrade.
  if (SHOP) {
    if (canHire(s)) {
      hire(s);
      purchases.push({ what: `hire ${s.staff.at(-1)}`, minute: s.minute - start });
    }
    const u = UPGRADES.find((x) => canBuy(s, x.id));
    if (u && !canHire(s)) {
      buyUpgrade(s, u.id);
      purchases.push({ what: u.label, minute: s.minute - start });
    }
  }
  tapBudget += TAPS_PER_SECOND * REAL_SEC_PER_MINUTE;

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
  if (needs.some((n) => r.needs[n] < NEED_THRESHOLD)) minutesLow++;
  if (needs.some((n) => r.needs[n] <= 0)) minutesEmpty++;

  if (r.unlockedRung !== lastRung) {
    for (let rung = lastRung + 1; rung <= r.unlockedRung; rung++) {
      const a = ACTIVITIES.find((x) => x.rung === rung)!;
      unlockedAt.push({ rung, label: a.label, minute: s.minute - start });
    }
    lastRung = r.unlockedRung;
  }
  if (r.milestones.length === MILESTONES.length) break;
}

const elapsed = s.minute - start;
const real = (minutes: number) => {
  const sec = Math.round(minutes * REAL_SEC_PER_MINUTE);
  return `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;
};
const day = (minutes: number) => `day ${(minutes / 1440 + 1).toFixed(1)}`;

console.log(`Bot taps up to ${TAPS_PER_SECOND}/s, shop ${SHOP ? 'on' : 'off'}. Real time at 1x.\n`);
for (const u of unlockedAt) {
  console.log(`  rung ${String(u.rung).padStart(2)} ${u.label.padEnd(16)} ${real(u.minute).padStart(8)}  (${day(u.minute)})`);
}
if (purchases.length) console.log('');
for (const p of purchases) console.log(`  buy  ${p.what.padEnd(36)} ${real(p.minute).padStart(8)}`);
const done = r.milestones.length === MILESTONES.length;
console.log(`\n  ${done ? 'Work trial done' : 'Not finished'} at ${real(elapsed)} (${day(elapsed)})`);
console.log(`  Proposals: try ${trySuccess} ok / ${tryFail} failed, milestones ${milestoneSuccess} ok / ${milestoneFail} failed`);
console.log(`  Any need below ${NEED_THRESHOLD}: ${((minutesLow / elapsed) * 100).toFixed(0)}% of the time`);
console.log(`  Any need at 0:     ${((minutesEmpty / elapsed) * 100).toFixed(0)}% of the time`);
console.log(`  Taps: ${taps} (${(taps / (elapsed * REAL_SEC_PER_MINUTE)).toFixed(2)} per real second)`);
console.log(`  Omsorg at cap:     ${s.omsorg.toFixed(0)} now`);
