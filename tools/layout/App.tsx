// The layout prototype: the real game at the 640×360 base, built from Terje's kit.
// Top left: the roster, a portrait per bed. Bottom left: the selected patient's needs and
// overskudd. Top right: menus, time and budget.
// Bottom: the loadout, round buttons the player nudges, with the omsorg bar below it.
// Bottom right: the card for the hovered button.
// The room: a click on the furniture shows its actions, to put them on the bar or take them off.
// Only the bar nudges and trains. Independent activities still run by themselves.
//
// Colour follows the currency: omsorg is pink (the pips and rings), overskudd is orange (training).
// The loadout lives in this page only. The sim still treats every unlocked activity as active,
// so staff still nudge actions that are not on the bar.
import { useEffect, useState } from 'preact/hooks';
import { ACTIVITY_BY_ID, type ActivityDef, type ActivityId } from '../../src/content/activities';
import { NEEDS, NEED_ORDER, type NeedId } from '../../src/content/needs';
import {
  GRANT_PER_BED,
  MAX_BEDS,
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
import { activeNeeds, effort, statusLine, unlockedActivities } from '../../src/sim/selectors';
import { selectedResident, type GameState, type Resident } from '../../src/sim/state';
import { TICKS_PER_SECOND, formatDate } from '../../src/sim/time';
import { act, useGame } from '../../src/store';
import needFood from './need-food.png';
import portraitArvid from './portrait-arvid.png';
import room from './room.jpg';

const W = 640;
const H = 360;
/** Slots in the loadout. */
const SLOTS = 9;
/** Width the omsorg pips may fill, inside the bar's border. */
const OMSORG_WIDTH = 159;

/** Portraits from panels.aseprite. The others show an initial until they have one. */
const PORTRAIT: Record<string, string> = { Arvid: portraitArvid };

/** Need art from panels.aseprite. The others use the emoji until they have art. */
const NEED_ART: Partial<Record<NeedId, string>> = { food: needFood };

/** Placeholder icons until icon set 1 exists. */
const NEED_ICON: Record<NeedId, string> = {
  food: '🍞',
  hygiene: '🚿',
  energy: '🛏️',
  home: '🏠',
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

type Loadout = (ActivityId | null)[];

/**
 * The loadout per bed: one entry per slot, so each action has a numbered place on the bar. Until
 * the player edits it, it is the first unlocked rungs.
 */
function useLoadouts() {
  const [edited, setEdited] = useState<Record<number, Loadout>>({});
  const get = (bed: number, r: Resident): Loadout => {
    const ids =
      edited[bed] ??
      unlockedActivities(r)
        .slice(0, SLOTS)
        .map((a) => a.id);
    return Array.from({ length: SLOTS }, (_, i) => {
      const id = ids[i];
      return id && r.unlockedRung >= ACTIVITY_BY_ID[id].rung ? id : null;
    });
  };
  /** Puts the action in the slot. In its own slot, it comes off. From another slot, the two swap. */
  const place = (bed: number, r: Resident, id: ActivityId, slot: number) => {
    const next = get(bed, r);
    const from = next.indexOf(id);
    if (from === slot) next[slot] = null;
    else {
      if (from >= 0) next[from] = next[slot] ?? null;
      next[slot] = id;
    }
    setEdited({ ...edited, [bed]: next });
  };
  return { get, place };
}

export function App() {
  const s = useGame();
  const zoom = useZoom();
  const [inspect, setInspect] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const loadouts = useLoadouts();
  const r = selectedResident(s);
  const loadout = r ? loadouts.get(s.selected, r) : [];
  const place = (id: ActivityId, slot: number) => r && loadouts.place(s.selected, r, id, slot);
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && setInspect(null);
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, []);
  return (
    <div class="screen" style={{ zoom: String(zoom) }}>
      {/* A still from the Lifelines prototype, in place of the 3D house. */}
      <div class="stage">
        <img class="room" src={room} alt="" onClick={() => setInspect(null)} />
        {r && <SceneBubble r={r} />}
        {r && <FurnitureSpots r={r} loadout={loadout} open={inspect} setOpen={setInspect} />}
      </div>
      <Roster s={s} />
      <PatientPanel r={r} />
      <TopBar s={s} />
      <Menus />
      {r && inspect !== null && (
        <FurniturePanel
          r={r}
          f={FURNITURE[inspect]!}
          loadout={loadout}
          place={place}
          setDragging={setDragging}
          key={inspect}
        />
      )}
      <OmsorgBar s={s} />
      {r && (
        <ActionBar
          s={s}
          r={r}
          loadout={loadout}
          placing={inspect !== null}
          dragging={dragging}
          place={place}
        />
      )}
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

// ---------- Top left: the roster ----------

/** One portrait per bed. The pip shows the lowest need, so the player sees who needs help. */
function Roster({ s }: { s: GameState }) {
  return (
    <nav class="roster">
      {s.beds.map((b, i) => (
        <button
          class={`face${i === s.selected ? ' picked' : ''}${b ? '' : ' empty'}`}
          onClick={() =>
            act((g) => {
              g.selected = i;
              if (!g.beds[i] && g.waiting.length) admit(g, 0);
            })
          }
          title={b ? b.name : 'Empty bed: admit the first on the venteliste'}
        >
          {b ? (
            <>
              {PORTRAIT[b.name] ? (
                <img src={PORTRAIT[b.name]} alt={b.name} />
              ) : (
                <span class="initial">{b.name[0]}</span>
              )}
              <span class={`r-pip ${needState(lowestNeed(b))}`} />
            </>
          ) : (
            '+'
          )}
        </button>
      ))}
      {s.beds.length < MAX_BEDS && (
        <button
          class="buy-bed"
          disabled={!canBuyBed(s)}
          title={`New bed: ${UNITS.plusKrPerW(GRANT_PER_BED * grantMult(s))} from the kommune`}
          onClick={() => act(buyBed)}
        >
          <span class="bed-icon">
            🛏️<span class="plus">+</span>
          </span>
          <span class="price">{bedCost(s)}</span>
        </button>
      )}
    </nav>
  );
}

function lowestNeed(r: Resident): number {
  return Math.min(...activeNeeds(r).map((n) => r.needs[n]));
}

// ---------- Bottom left: the selected patient ----------

/** One row per need and one for overskudd: the icon on the left, the name over the bar. */
function PatientPanel({ r }: { r: Resident | null }) {
  if (!r) return null;
  return (
    <section class="patient">
      {NEED_ORDER.filter((n) => activeNeeds(r).includes(n)).map((n) => (
        <div class="need" key={n}>
          <span class="need-art">
            {NEED_ART[n] ? <img src={NEED_ART[n]} alt="" /> : NEED_ICON[n]}
          </span>
          <span class="label">{NEEDS[n].label}</span>
          <KitBar piece="bar-need" state={needState(r.needs[n])} value={r.needs[n] / 100} />
        </div>
      ))}
      {/* The arrow, as over the buttons: overskudd pays for training. */}
      <div class="need overskudd" title="Overskudd: spent on training">
        <span class="need-art">
          <span class="mini-arrow" />
        </span>
        <span class="label">Overskudd {Math.floor(r.overskudd)}</span>
        <KitBar piece="bar-overskudd" value={r.overskudd / OVERSKUDD_CAP} />
      </div>
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
 * One pip per omsorg, the same pink as the segments on the rings: a nudge moves a pip from here
 * into a ring. The pips get narrower as the cap grows, so the bar keeps its length.
 */
function OmsorgBar({ s }: { s: GameState }) {
  const cap = omsorgCap(s);
  const have = Math.floor(s.omsorg);
  const w = Math.max(1, Math.floor((OMSORG_WIDTH + 1) / cap) - 1);
  return (
    <div class="omsorg" title="Omsorg: 1 per nudge">
      <span class="label">
        Omsorg {have}/{cap}
      </span>
      <span class="omsorg-bar">
        {Array.from({ length: cap }, (_, i) => (
          <span class={i < have ? 'pip on' : 'pip'} style={{ width: `${w}px` }} />
        ))}
      </span>
    </div>
  );
}

// ---------- Bottom: the loadout ----------

/** Diameter of a button with its ring. */
const BUTTON = 43;

/** Drag data type for an action dragged from the furniture to the bar. */
const DRAG_TYPE = 'text/x-activity';

/**
 * Round buttons with the effort ring around the icon. The rings are drawn in SVG at screen
 * resolution, not in pixels: a ring of 12 segments must stay readable. Hover shows the card in the
 * bottom right corner at once. The card is out of the way, so it needs no delay.
 */
function ActionBar(props: {
  s: GameState;
  r: Resident;
  loadout: Loadout;
  /** The furniture panel is open: the slots show their numbers. */
  placing: boolean;
  dragging: boolean;
  place: (id: ActivityId, slot: number) => void;
}) {
  const { s, r, loadout, placing, dragging, place } = props;
  const [open, setOpen] = useState<number | null>(null);
  const hovered = open !== null ? loadout[open] : undefined;
  return (
    <>
      <section
        class={`actions${placing ? ' placing' : ''}${dragging ? ' dragging' : ''}`}
        onMouseLeave={() => setOpen(null)}
      >
        {Array.from({ length: SLOTS }, (_, i) => {
          const id = loadout[i];
          const drop = {
            onDragOver: (e: DragEvent) => e.preventDefault(),
            onDrop: (e: DragEvent) => {
              const dropped = e.dataTransfer?.getData(DRAG_TYPE) as ActivityId | undefined;
              if (dropped) place(dropped, i);
            },
          };
          return id ? (
            <ActionButton
              s={s}
              r={r}
              a={ACTIVITY_BY_ID[id]}
              open={open === i}
              onEnter={() => setOpen(i)}
              drop={drop}
              key={id}
            />
          ) : (
            <span class="slot empty" onMouseEnter={() => setOpen(null)} {...drop}>
              <span class="slot-n">{i + 1}</span>
            </span>
          );
        })}
      </section>
      {hovered && <Tooltip s={s} r={r} a={ACTIVITY_BY_ID[hovered]} />}
    </>
  );
}

function ActionButton(props: {
  s: GameState;
  r: Resident;
  a: ActivityDef;
  open: boolean;
  onEnter: () => void;
  drop: Record<'onDragOver' | 'onDrop', (e: DragEvent) => void>;
}) {
  const { s, r, a, open, onEnter, drop } = props;
  const bed = s.selected;
  const size = effort(r, a.id);
  const auto = size === 0;
  const starved = !auto && !canNudge(s, bed, a.id) && r.bars[a.id] < size;
  const go = () => act((g) => nudge(g, bed, a.id));
  return (
    <span
      class={`slot${auto ? ' auto' : ''}${open ? ' hover' : ''}`}
      onMouseEnter={onEnter}
      {...drop}
    >
      {!auto && canTrain(s, bed, a.id) && <TrainArrow s={s} r={r} a={a} />}
      <span
        class="disc"
        role="button"
        tabIndex={auto ? -1 : 0}
        aria-label={a.label}
        onClick={go}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go())}
      >
        {!auto && <EffortRing size={size} filled={r.bars[a.id]} starved={starved} />}
        <span class="icon">{a.icon}</span>
      </span>
    </span>
  );
}

const RING_R = 19;
const RING_W = 4;
/** The gap between two segments, as a length on the ring. */
const RING_GAP = 1.5;

/** One arc per nudge, clockwise from the top, as in the first prototype. */
function EffortRing(props: { size: number; filled: number; starved: boolean }) {
  const { size, filled, starved } = props;
  const c = BUTTON / 2;
  const step = (2 * Math.PI) / size;
  const gap = Math.min(step * 0.35, RING_GAP / RING_R);
  const point = (angle: number) =>
    `${c + RING_R * Math.sin(angle)} ${c - RING_R * Math.cos(angle)}`;
  return (
    <svg
      class={starved ? 'ring starved' : 'ring'}
      viewBox={`0 0 ${BUTTON} ${BUTTON}`}
      aria-hidden="true"
    >
      {Array.from({ length: size }, (_, i) => {
        const from = i * step + gap / 2;
        const to = (i + 1) * step - gap / 2;
        return (
          <path
            class={i < filled ? 'seg on' : 'seg'}
            stroke-width={RING_W}
            d={`M ${point(from)} A ${RING_R} ${RING_R} 0 0 1 ${point(to)}`}
          />
        );
      })}
    </svg>
  );
}

/** Spends overskudd on the next level. The colour names the currency. */
function TrainArrow(props: { s: GameState; r: Resident; a: ActivityDef }) {
  const { s, r, a } = props;
  const bed = s.selected;
  const skill = r.skill[a.id];
  return (
    <button
      class="train-arrow"
      disabled={!canTrain(s, bed, a.id)}
      title={`${trainCost(skill)} overskudd`}
      onClick={(e) => {
        e.stopPropagation();
        act((g) => train(g, bed, a.id));
      }}
    >
      {trainCost(skill)}
    </button>
  );
}

/**
 * The card for the hovered button, in the bottom right corner. The train arrow stays over the
 * button, so the card only names the price.
 */
function Tooltip(props: { s: GameState; r: Resident; a: ActivityDef }) {
  const { s, r, a } = props;
  const auto = effort(r, a.id) === 0;
  const skill = r.skill[a.id];
  return (
    <div class="tip-card">
      <span class="tip-icon">{a.icon}</span>
      <span class="title">{a.label}</span>
      <span class="lvl muted">lvl {skill + 1}</span>
      <span class="muted">{a.duration} sec</span>
      <span class="refills">
        {NEED_ORDER.filter((n) => a.refills[n]).map((n) => (
          <span class="refill">
            <span class="need-icon">{NEED_ICON[n]}</span>+{a.refills[n]}
          </span>
        ))}
      </span>
      {auto ? (
        <span class="tip-train muted">Independent</span>
      ) : (
        <span class={`tip-train${canTrain(s, s.selected, a.id) ? '' : ' short'}`}>
          Train {trainCost(skill)} overskudd
        </span>
      )}
    </div>
  );
}

// ---------- The room: furniture holds the actions ----------

interface Furniture {
  name: string;
  /** The click area over the still, at the 640×360 base. */
  x: number;
  y: number;
  w: number;
  h: number;
  actions: ActivityId[];
}

// TODO(Terje): placeholder names and a placeholder split. The still is a living room only, so the
// door stands in for the bathroom and the world outside.
const FURNITURE: Furniture[] = [
  { name: 'Door', x: 222, y: 56, w: 40, h: 72, actions: ['shower', 'walk', 'groceries'] },
  { name: 'Sofa', x: 146, y: 128, w: 96, h: 70, actions: ['sleep', 'call'] },
  { name: 'Table', x: 206, y: 170, w: 74, h: 42, actions: ['eat', 'dishes'] },
  { name: 'Shelf', x: 362, y: 88, w: 76, h: 98, actions: ['tidy', 'laundry'] },
];

/** Click areas over the furniture. A dot marks furniture with an action the bar does not hold. */
function FurnitureSpots(props: {
  r: Resident;
  loadout: Loadout;
  open: number | null;
  setOpen: (i: number | null) => void;
}) {
  const { r, loadout, open, setOpen } = props;
  return (
    <>
      {FURNITURE.map((f, i) => {
        const fresh = f.actions.some(
          (id) =>
            r.unlockedRung >= ACTIVITY_BY_ID[id].rung && effort(r, id) > 0 && !loadout.includes(id),
        );
        return (
          <button
            class={`spot${open === i ? ' open' : ''}`}
            style={{ left: `${f.x}px`, top: `${f.y}px`, width: `${f.w}px`, height: `${f.h}px` }}
            aria-label={f.name}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {fresh && <span class="fresh" />}
          </button>
        );
      })}
    </>
  );
}

/**
 * The actions on one piece of furniture. The list on the left holds all of them, locked ones too.
 * The detail on the right shows what the selected one gives, the levels ahead, and the 9 places on
 * the bar. A click on a place, or a drag to the bar, puts the action there.
 */
function FurniturePanel(props: {
  r: Resident;
  f: Furniture;
  loadout: Loadout;
  place: (id: ActivityId, slot: number) => void;
  setDragging: (on: boolean) => void;
}) {
  const { r, f, loadout, place, setDragging } = props;
  const [picked, setPicked] = useState<ActivityId>(f.actions[0]!);
  const drag = (id: ActivityId) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer?.setData(DRAG_TYPE, id);
      setDragging(true);
    },
    onDragEnd: () => setDragging(false),
  });
  const open = (id: ActivityId) => r.unlockedRung >= ACTIVITY_BY_ID[id].rung;
  return (
    <section class="kit-window furniture">
      <ul class="f-list">
        <li class="title">{f.name}</li>
        {f.actions.map((id) => {
          const a = ACTIVITY_BY_ID[id];
          return (
            <li
              class={`f-row${picked === id ? ' picked' : ''}${open(id) ? '' : ' locked'}`}
              onClick={() => setPicked(id)}
              {...(open(id) ? drag(id) : {})}
            >
              <span class="mini-disc">{a.icon}</span>
              <span class="f-name">{a.label}</span>
            </li>
          );
        })}
      </ul>
      <Detail
        r={r}
        a={ACTIVITY_BY_ID[picked]}
        loadout={loadout}
        open={open(picked)}
        drag={drag(picked)}
        place={place}
      />
    </section>
  );
}

function Detail(props: {
  r: Resident;
  a: ActivityDef;
  loadout: Loadout;
  open: boolean;
  drag: object;
  place: (id: ActivityId, slot: number) => void;
}) {
  const { r, a, loadout, open, drag, place } = props;
  const skill = r.skill[a.id];
  // The next rung opens when fewer than LEARNING_WINDOW actions are still being learned.
  const waiting = Math.max(0, a.rung - r.unlockedRung);
  return (
    <div class={`f-detail${open ? '' : ' locked'}`}>
      <span class="tip-icon" {...(open ? drag : {})}>
        {a.icon}
      </span>
      <span class="title">{a.label}</span>
      {open && <span class="lvl muted">lvl {skill + 1}</span>}
      <span class="muted">{a.duration} sec duration</span>
      <span class="refills">
        {NEED_ORDER.filter((n) => a.refills[n]).map((n) => (
          <span class="refill">
            <span class="need-icon">{NEED_ICON[n]}</span>+{a.refills[n]}
          </span>
        ))}
      </span>
      {open ? (
        <span class="places">
          {loadout.map((id, i) => (
            <button
              class={`place${id === a.id ? ' here' : id ? ' taken' : ''}`}
              onClick={() => place(a.id, i)}
            >
              {id ? ACTIVITY_BY_ID[id].icon : i + 1}
            </button>
          ))}
        </span>
      ) : (
        // Locked: one dashed disc for each action that must become independent first.
        <span class="unlock">
          {Array.from({ length: waiting }, () => (
            <span class="waiting" />
          ))}
        </span>
      )}
    </div>
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
