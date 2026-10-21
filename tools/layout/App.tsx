// The layout prototype: the real game at the 960×540 base, built from Terje's kit.
// Top left: the patient (beds, needs, overskudd). Top: time and budget. Top right: menus.
// Bottom: the loadout, the actions the player nudges, with the omsorg pips above it.
// Left edge: categories, one per need. A category opens a drawer to train actions and to swap
// them in and out of the loadout. The middle stays free for the house.
//
// Colour follows the currency: omsorg is pink (the pips), overskudd is orange (training).
// The loadout lives in this page only. The sim still treats every unlocked activity as active.
import { useEffect, useState } from 'preact/hooks';
import {
  ACTIVITIES,
  ACTIVITY_BY_ID,
  type ActivityDef,
  type ActivityId,
} from '../../src/content/activities';
import { NEEDS, NEED_ORDER, type NeedId } from '../../src/content/needs';
import {
  GRANT_PER_BED,
  MAX_BEDS,
  MAX_SKILL,
  NEED_THRESHOLD,
  OVERSKUDD_CAP,
  trainCost,
} from '../../src/content/tuning';
import { UNITS } from '../../src/content/text';
import { KitBar } from '../../src/kit/components';
import { admit, buyBed, canNudge, canTrain, nudge, train } from '../../src/sim/actions';
import {
  bedCost,
  canBuyBed,
  grantMult,
  netIncomePerWeek,
  omsorgCap,
} from '../../src/sim/institution';
import { closeProposal, decline } from '../../src/sim/proposals';
import {
  activeNeeds,
  effort,
  readyQueue,
  statusLine,
  unlockedActivities,
} from '../../src/sim/selectors';
import { selectedResident, type GameState, type Resident } from '../../src/sim/state';
import { TICKS_PER_SECOND, formatDate } from '../../src/sim/time';
import { act, useGame } from '../../src/store';
import room from './room.jpg';

const W = 960;
const H = 540;
/** Slots in the loadout. */
const SLOTS = 6;
/** Width the omsorg pips may fill, about half the screen. */
const OMSORG_WIDTH = 470;

/** Placeholder icons until icon set 1 exists. */
const NEED_ICON: Record<NeedId, string> = {
  food: '🍞',
  hygiene: '🚿',
  energy: '🛏️',
  home: '🧹',
  social: '📞',
};

function useZoom() {
  const fit = () => Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  const [zoom, setZoom] = useState(fit);
  useEffect(() => {
    const on = () => setZoom(fit());
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return zoom;
}

/** The loadout per bed. Until the player edits it, it is the first unlocked rungs. */
function useLoadouts() {
  const [edited, setEdited] = useState<Record<number, ActivityId[]>>({});
  const get = (bed: number, r: Resident): ActivityId[] =>
    edited[bed]?.filter((id) => r.unlockedRung >= ACTIVITY_BY_ID[id].rung) ??
    unlockedActivities(r)
      .slice(0, SLOTS)
      .map((a) => a.id);
  const toggle = (bed: number, r: Resident, id: ActivityId) => {
    const now = get(bed, r);
    const next = now.includes(id)
      ? now.filter((x) => x !== id)
      : now.length < SLOTS
        ? [...now, id]
        : now;
    setEdited({ ...edited, [bed]: next });
  };
  return { get, toggle };
}

export function App() {
  const s = useGame();
  const zoom = useZoom();
  const [drawer, setDrawer] = useState<NeedId | null>(null);
  const loadouts = useLoadouts();
  const r = selectedResident(s);
  const loadout = r ? loadouts.get(s.selected, r) : [];
  return (
    <div class="screen" style={{ zoom: String(zoom) }}>
      {/* A still from the Lifelines prototype, in place of the 3D house. */}
      <div class="stage">
        <img class="room" src={room} alt="" />
        {r && <SceneBubble r={r} />}
      </div>
      <PatientPanel s={s} r={r} />
      <TopBar s={s} />
      <Menus />
      {r && <Rail s={s} r={r} open={drawer} setOpen={setDrawer} />}
      {r && drawer && (
        <Drawer
          s={s}
          r={r}
          need={drawer}
          loadout={loadout}
          toggle={(id) => loadouts.toggle(s.selected, r, id)}
          close={() => setDrawer(null)}
        />
      )}
      <OmsorgPips s={s} />
      {r && <ActionBar s={s} r={r} loadout={loadout} />}
      {s.proposal && <ProposalStub s={s} />}
    </div>
  );
}

// ---------- The scene: what the patient does now ----------

/** The running activity lives in the scene: the status line and its progress over the head. */
function SceneBubble({ r }: { r: Resident }) {
  const cur = r.current;
  const a = cur && ACTIVITY_BY_ID[cur.id];
  const progress = cur && a ? 1 - cur.remaining / (a.duration * TICKS_PER_SECOND) : 0;
  return (
    <div class="kit-card bubble" data-state="subtle">
      <span>{statusLine(r)}</span>
      {cur && (
        <span class="scene-progress">
          <span style={{ width: `${progress * 100}%` }} />
        </span>
      )}
    </div>
  );
}

// ---------- Top left: the patient ----------

function PatientPanel({ s, r }: { s: GameState; r: Resident | null }) {
  return (
    <section class="patient">
      <div class="beds">
        {s.beds.map((b, i) => (
          <button
            class={i === s.selected ? 'kit-button-2' : 'kit-button-quiet'}
            onClick={() =>
              act((g) => {
                g.selected = i;
                if (!g.beds[i] && g.waiting.length) admit(g, 0);
              })
            }
            title={b ? b.name : 'Empty bed: admit the first on the venteliste'}
          >
            {b ? b.name : '+'}
          </button>
        ))}
        {s.beds.length < MAX_BEDS && (
          <button
            class="kit-button-1"
            disabled={!canBuyBed(s)}
            title={`${UNITS.plusKrPerW(GRANT_PER_BED * grantMult(s))} from the kommune`}
            onClick={() => act(buyBed)}
          >
            Bed {bedCost(s)}
          </button>
        )}
      </div>
      {r ? (
        <>
          <div class="who">
            <span class="name">{r.name}</span>
          </div>
          {NEED_ORDER.filter((n) => activeNeeds(r).includes(n)).map((n) => (
            <div class="meter-row" key={n}>
              <span class="label">{NEEDS[n].label}</span>
              <KitBar piece="bar-need" state={needState(r.needs[n])} value={r.needs[n] / 100} />
            </div>
          ))}
          <div class="meter-row overskudd">
            <span class="label">Overskudd</span>
            <KitBar piece="bar-overskudd" value={r.overskudd / OVERSKUDD_CAP} />
            <span class="num">{Math.floor(r.overskudd)}</span>
          </div>
        </>
      ) : (
        <div class="muted">Empty bed</div>
      )}
    </section>
  );
}

function needState(v: number): string {
  if (v < NEED_THRESHOLD / 2) return 'emergency';
  if (v < NEED_THRESHOLD) return 'warning';
  if (v < 60) return 'neutral';
  return 'good';
}

// ---------- Top: time and budget ----------

function TopBar({ s }: { s: GameState }) {
  return (
    <section class="topbar">
      <button
        class="kit-button-quiet"
        onClick={() => act((g) => (g.speed = g.speed === 0 ? 1 : 0))}
        title={s.speed === 0 ? 'Play' : 'Pause'}
      >
        {s.speed === 0 ? 'Play' : 'Pause'}
      </button>
      <span>{formatDate(s.tick)}</span>
      <span class="sep" />
      <span>{UNITS.kr(Math.floor(s.budget))}</span>
      <span class="muted">{UNITS.signedPerW(netIncomePerWeek(s))}</span>
    </section>
  );
}

// ---------- Top right: menus ----------

function Menus() {
  // Not wired yet: the menus are the next screens to build from the kit.
  return (
    <nav class="menus">
      {['Upgrades', 'Staff', 'Training', 'Venteliste', 'Log'].map((m) => (
        <button class="kit-button-quiet" title="Not built yet">
          {m}
        </button>
      ))}
    </nav>
  );
}

// ---------- Bottom: omsorg ----------

/**
 * One pip per omsorg, the same pink as the pips in the cards: a nudge moves a pip from here into a
 * card. The pips get narrower as the cap grows, so the bar keeps its length.
 */
function OmsorgPips({ s }: { s: GameState }) {
  const cap = omsorgCap(s);
  const have = Math.floor(s.omsorg);
  const w = Math.max(2, Math.floor(OMSORG_WIDTH / cap) - 1);
  return (
    <div class="omsorg" title="Omsorg: 1 per nudge">
      <span class="label">Omsorg</span>
      <span class="pips omsorg-pips">
        {Array.from({ length: cap }, (_, i) => (
          <span class={i < have ? 'pip on' : 'pip'} style={{ width: `${w}px` }} />
        ))}
      </span>
      <span class="num">
        {have}/{cap}
      </span>
    </div>
  );
}

// ---------- Bottom: the loadout ----------

function ActionBar({ s, r, loadout }: { s: GameState; r: Resident; loadout: ActivityId[] }) {
  const queue = readyQueue(r);
  return (
    <section class="actions">
      {loadout.map((id) => (
        <ActionCard
          s={s}
          r={r}
          a={ACTIVITY_BY_ID[id]}
          queued={queue.some((a) => a.id === id)}
          key={id}
        />
      ))}
    </section>
  );
}

function ActionCard({
  s,
  r,
  a,
  queued,
}: {
  s: GameState;
  r: Resident;
  a: ActivityDef;
  queued: boolean;
}) {
  const bed = s.selected;
  const size = effort(r, a.id);
  const auto = size === 0;
  const doing = r.current?.id === a.id;
  const starved = !auto && !canNudge(s, bed, a.id) && r.bars[a.id] < size;
  // Queued (bar full, waiting its turn) is dashed. Running shows in the scene, so the card only dims.
  const state = auto || doing ? 'subtle' : queued ? 'dashed' : 'normal';
  const go = () => act((g) => nudge(g, bed, a.id));
  return (
    <div
      class={`kit-card act${doing ? ' doing' : ''}`}
      data-state={state}
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go())}
    >
      <span class="icon">
        {a.icon}
        <span class="lvl">{r.skill[a.id] + 1}</span>
      </span>
      <span class="title">{a.label}</span>
      {auto ? (
        <span class="muted">Independent</span>
      ) : (
        <span class={starved ? 'pips starved' : 'pips'}>
          {Array.from({ length: size }, (_, i) => (
            <span class={i < r.bars[a.id] ? 'pip on' : 'pip'} />
          ))}
        </span>
      )}
    </div>
  );
}

// ---------- Left edge: categories ----------

function Rail(props: {
  s: GameState;
  r: Resident;
  open: NeedId | null;
  setOpen: (n: NeedId | null) => void;
}) {
  const { s, r, open, setOpen } = props;
  const unlocked = unlockedActivities(r);
  return (
    <nav class="rail">
      {NEED_ORDER.map((n) => {
        const acts = unlocked.filter((a) => a.trigger === n);
        const low = activeNeeds(r).includes(n) && r.needs[n] < NEED_THRESHOLD;
        const trainable = acts.filter((a) => canTrain(s, s.selected, a.id)).length;
        return (
          <button
            class={`kit-card cat${low ? ' low' : ''}`}
            data-state={!acts.length ? 'disabled' : open === n ? 'selected' : 'subtle'}
            disabled={!acts.length}
            title={NEEDS[n].label}
            onClick={() => setOpen(open === n ? null : n)}
          >
            <span class="icon">{NEED_ICON[n]}</span>
            {trainable > 0 && <span class="badge train">▲{trainable}</span>}
          </button>
        );
      })}
    </nav>
  );
}

/** A category: train its actions with overskudd, and swap them in and out of the loadout. */
function Drawer(props: {
  s: GameState;
  r: Resident;
  need: NeedId;
  loadout: ActivityId[];
  toggle: (id: ActivityId) => void;
  close: () => void;
}) {
  const { s, r, need, loadout, toggle, close } = props;
  const bed = s.selected;
  const acts = ACTIVITIES.filter((a) => a.trigger === need);
  return (
    <section class="kit-window drawer">
      <header>
        <span class="title">{NEEDS[need].label}</span>
        <span class="overskudd-have">
          <KitBar piece="bar-overskudd" value={r.overskudd / OVERSKUDD_CAP} />
          <span>{Math.floor(r.overskudd)} overskudd</span>
        </span>
        <button class="kit-button-quiet" onClick={close}>
          Close
        </button>
      </header>
      {acts.map((a) => {
        const locked = a.rung > r.unlockedRung;
        if (locked) {
          return (
            <div class="row locked" key={a.id}>
              <span class="icon">{a.icon}</span>
              <span>{a.label}</span>
              <span class="muted">Opens later</span>
            </div>
          );
        }
        const skill = r.skill[a.id];
        const size = effort(r, a.id);
        const inBar = loadout.includes(a.id);
        const maxed = size === 0;
        return (
          <div class="row" key={a.id}>
            <span class="icon">{a.icon}</span>
            <span class="what">
              <span class="title">{a.label}</span>
              <span class="muted">
                lvl {skill + 1}
                {maxed ? ' · independent' : ` · ${size} nudges`}
              </span>
            </span>
            {!maxed && (
              <button
                class="train-button"
                disabled={!canTrain(s, bed, a.id)}
                onClick={() => act((g) => train(g, bed, a.id))}
                title={`Spend ${trainCost(skill)} overskudd`}
              >
                ▲ Train · {trainCost(skill)}
                <span class="effect">
                  {skill + 1 >= MAX_SKILL
                    ? 'independent'
                    : `${size} → ${effort(r, a.id, skill + 1)}`}
                </span>
              </button>
            )}
            <button
              class={inBar ? 'kit-button-quiet' : 'kit-button-2'}
              disabled={!inBar && loadout.length >= SLOTS}
              onClick={() => toggle(a.id)}
            >
              {inBar ? 'In bar' : 'Add'}
            </button>
          </div>
        );
      })}
      <span class="muted">
        Bar {loadout.length}/{SLOTS}
      </span>
    </section>
  );
}

// ---------- A proposal pauses the game ----------

function ProposalStub({ s }: { s: GameState }) {
  const r = s.beds[s.proposal!.bed];
  return (
    <div class="kit-window proposal">
      <span class="title">{r?.name} wants to try something new.</span>
      <span class="muted">
        The proposal dialog is not built here yet. Play it in the main game.
      </span>
      <button
        class="kit-button-quiet"
        onClick={() =>
          act((g) => {
            decline(g);
            closeProposal(g);
          })
        }
      >
        Not now
      </button>
    </div>
  );
}
