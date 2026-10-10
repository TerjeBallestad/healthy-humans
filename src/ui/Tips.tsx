import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { ACTIVITY_BY_ID, type ActivityId } from '../content/activities';
import { MILESTONES, MILESTONE_BY_ID } from '../content/milestones';
import { GRANT_PER_BED } from '../content/tuning';
import { UPGRADES } from '../content/upgrades';
import { canNudge, canTrain, freeBed } from '../sim/actions';
import { bestTier } from '../sim/discharge';
import { canBuy, canBuyBed, grantMult, hireCost } from '../sim/institution';
import { isSeen, markSeen } from '../sim/reveal';
import { effort, unlockedActivities } from '../sim/selectors';
import { proposalCost, surePrice } from '../sim/proposals';
import { canPostAd } from '../sim/staff';
import { selectedResident, type GameState } from '../sim/state';
import { act, useGame } from '../store';
import { modal } from './modal';

interface Tip {
  key: string;
  /** The element the tip points at. A click on it completes the tip. */
  target: string;
  /** More elements to light up. */
  also?: string;
  /** Where the bubble goes. Below (or above) the target by default. */
  side?: 'right';
  title: string;
  text: string;
}

/** The activity the first tip points at. Fixed once chosen, so the tip does not jump. */
let firstActivity: ActivityId | null = null;

/** The first tip not done whose moment has come. One at a time. */
function currentTip(s: GameState): Tip | null {
  return pick(s, s.proposal ? proposalTips(s) : screenTips(s));
}

/** Tips inside the milestone proposal, in order. The game is already paused there. */
function proposalTips(s: GameState): (() => Tip | null)[] {
  const p = s.proposal!;
  const r = s.beds[p.bed];
  if (!r || p.outcome) return [];
  const m = MILESTONE_BY_ID[p.subject.milestone];
  return [
    () => ({
      key: 'tip:milestone',
      target: '[data-tip="track"]',
      title: 'A milestone',
      side: 'right',
      text: `${r.name} wants to try something big: ${m.label}. ${MILESTONES.length} milestones lead to a healthy human.`,
    }),
    () => ({
      key: 'tip:wager',
      target: '[data-tip="wager"]',
      also: '[data-tip="odds"]',
      title: 'Drag here',
      side: 'right',
      text: `Spend kroner on support to raise the odds. At ${surePrice(p.subject)} kr it is sure to work.`,
    }),
    () => ({
      key: 'tip:go',
      target: '[data-tip="go"]',
      also: '[data-tip="drain"]',
      title: 'Click here',
      side: 'right',
      text: `Go costs ${proposalCost(p.subject)} overskudd (striped on the bar) and rolls the odds. "Not now" is free, and ${r.name} asks again later.`,
    }),
  ];
}

function pick(s: GameState, tips: (() => Tip | null)[]): Tip | null {
  for (const t of tips) {
    const tip = t();
    // A tip waits until its target is on screen.
    if (tip && !isSeen(s, tip.key) && document.querySelector(tip.target)) return tip;
  }
  return null;
}

/** Tips on the main screen, in order. */
function screenTips(s: GameState): (() => Tip | null)[] {
  const r = selectedResident(s);
  return [
    () => {
      if (!r) return null;
      const open = unlockedActivities(r).filter(
        (a) => effort(r, a.id) > 0 && canNudge(s, s.selected, a.id),
      );
      if (!firstActivity || !open.some((a) => a.id === firstActivity))
        firstActivity = open.sort((a, b) => r.needs[a.trigger] - r.needs[b.trigger])[0]?.id ?? null;
      if (!firstActivity) return null;
      const a = ACTIVITY_BY_ID[firstActivity];
      return {
        key: 'tip:nudge',
        target: `[data-tip="act-${a.id}"]`,
        title: 'Click here',
        text: `${r.name} struggles with ${a.noun}. Use omsorg to nudge ${a.noun}. A full ring means ${r.name} does it when it is needed.`,
      };
    },
    () =>
      isSeen(s, 'tip:nudge') && s.omsorg < 1
        ? {
            key: 'tip:omsorg',
            target: '[data-tip="omsorg"]',
            title: 'Omsorg',
            text: 'Your energy to care. Each nudge costs 1. It refills over time.',
          }
        : null,
    () => {
      if (!r) return null;
      const a = unlockedActivities(r).find((x) => canTrain(s, s.selected, x.id));
      if (!a) return null;
      return {
        key: 'tip:train',
        target: `[data-tip="train-${a.id}"]`,
        also: '[data-tip="overskudd"]',
        title: 'Click here',
        text: `Increase the independence of ${a.noun}. Each level halves the nudges required. It costs overskudd, which grows while the needs are green.`,
      };
    },
    () =>
      canPostAd(s)
        ? {
            key: 'tip:hire',
            target: '[data-tip="hire"]',
            title: 'Hire staff',
            text: `A job ad costs ${hireCost(s)} kr. A week later, candidates answer. Staff nudge for you.`,
          }
        : null,
    () =>
      UPGRADES.some((u) => canBuy(s, u.id))
        ? {
            key: 'tip:upgrades',
            target: '[data-tip="upgrades"]',
            title: 'Upgrades',
            text: 'Spend kroner to make your work, your staff and the house stronger.',
          }
        : null,
    () =>
      canBuyBed(s)
        ? {
            key: 'tip:bed',
            target: '[data-tip="bed"]',
            title: 'One more bed',
            text: `Room for one more resident. Each bed adds ${GRANT_PER_BED * grantMult(s)} kr/week to the grant.`,
          }
        : null,
    () =>
      freeBed(s) >= 0 && s.waiting.length > 0
        ? {
            key: 'tip:admit',
            target: '[data-tip="admit"]',
            title: 'Click here',
            text: 'Choose who moves in. The worst health is on top. At 0 health the person is lost.',
          }
        : null,
    () =>
      r && bestTier(r)
        ? {
            key: 'tip:discharge',
            target: '[data-tip="discharge"]',
            title: 'Ready to go home',
            text: `${r.name} can go home now. A higher tier pays more tax, but the bed stays full while you wait.`,
          }
        : null,
  ];
}

const GAP = 10;
/** Real milliseconds a new tip ignores clicks, so a fast clicker reads it first. */
const GRACE_MS = 1500;

/** A "Click here" bubble next to the element it explains. */
export function Tips() {
  const s = useGame();
  const tip = s.seen && !modal.value && !s.discharge ? currentTip(s) : null;
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const done = () => tip && ready && act((g) => markSeen(g, tip.key));

  // The game pauses while a tip shows. It resumes when the tip goes, unless a dialog took over.
  useEffect(() => {
    setReady(false);
    if (!tip) return;
    act((g) => {
      g.resumeSpeed = g.speed || g.resumeSpeed;
      g.speed = 0;
    });
    const id = setTimeout(() => setReady(true), GRACE_MS);
    return () => {
      clearTimeout(id);
      act((g) => {
        if (!modal.value && !g.proposal && !g.discharge) g.speed = g.resumeSpeed;
      });
    };
  }, [tip?.key]);

  // Light up the target and listen for a click on it.
  useEffect(() => {
    if (!tip) return;
    const els = [
      ...document.querySelectorAll<HTMLElement>(tip.target),
      ...(tip.also ? document.querySelectorAll<HTMLElement>(tip.also) : []),
    ];
    els.forEach((el) => el.classList.add('tip-target'));
    const main = document.querySelector<HTMLElement>(tip.target);
    const key = tip.key;
    const shown = performance.now();
    const onClick = () => {
      if (performance.now() - shown >= GRACE_MS) act((g) => markSeen(g, key));
    };
    main?.addEventListener('click', onClick);
    return () => {
      els.forEach((el) => el.classList.remove('tip-target'));
      main?.removeEventListener('click', onClick);
    };
  }, [tip?.key, tip?.target]);

  // Place the bubble below the target, or above it near the bottom of the screen.
  useLayoutEffect(() => {
    const el = tip && document.querySelector<HTMLElement>(tip.target);
    const b = box.current;
    if (!el || !b) return;
    const t = el.getBoundingClientRect();
    const w = b.offsetWidth;
    const h = b.offsetHeight;
    // To the right of the dialog, so the bubble does not hide what it explains.
    const edge = el.closest('.dialog')?.getBoundingClientRect().right ?? t.right;
    if (tip!.side === 'right' && edge + GAP + w < window.innerWidth) {
      b.style.left = `${edge + GAP}px`;
      b.style.top = `${Math.max(8, Math.min(t.top + t.height / 2 - h / 2, window.innerHeight - h - 8))}px`;
      b.dataset.side = 'right';
      return;
    }
    const left = Math.min(Math.max(8, t.left + t.width / 2 - w / 2), window.innerWidth - w - 8);
    const below = t.bottom + GAP + h < window.innerHeight;
    b.style.left = `${left}px`;
    b.style.top = `${below ? t.bottom + GAP : t.top - GAP - h}px`;
    b.dataset.side = below ? 'below' : 'above';
  });

  if (!tip) return null;
  return (
    <div class="tip" ref={box} role="note">
      <strong>{tip.title}</strong>
      <span>{tip.text}</span>
      <button class="tip-ok" disabled={!ready} onClick={done}>
        OK
      </button>
    </div>
  );
}
