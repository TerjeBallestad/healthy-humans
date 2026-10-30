// The layout prototype: the real game at the 640×360 base, built from Terje's kit.
// Top left: the roster, a portrait per bed. Bottom left: the selected patient's needs and
// overskudd. A click on the selected portrait or on the needs opens the character window over the
// left edge, with tabs. Left is the person, right is the house, the middle is the room. Top right: menus, time and budget.
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
import { ARCHETYPE_BY_ID } from '../../src/content/archetypes';
import { COLOUR_CSS, identityLabel } from '../../src/content/identity';
import {
  MILESTONE_BY_ID,
  PHASES,
  PHASE_LABEL,
  REACTION_FACE,
  type Phase,
} from '../../src/content/milestones';
import { NEEDS, NEED_ORDER, type NeedId } from '../../src/content/needs';
import { TRAIT_BY_ID } from '../../src/content/traits';
import {
  GRANT_PER_BED,
  MAX_BEDS,
  NEED_THRESHOLD,
  OVERSKUDD_CAP,
  trainCost,
} from '../../src/content/tuning';
import { RESIDENT, UNITS } from '../../src/content/text';
import { KitBar } from '../../src/kit/components';
import { ICONS, type IconName } from '../../src/kit/icons';
import { admit, buyBed, canNudge, canTrain, nudge, train } from '../../src/sim/actions';
import {
  bedCost,
  canBuyBed,
  grantMult,
  identitiesShown,
  netIncomePerWeek,
  omsorgCap,
} from '../../src/sim/institution';
import { bestTier, nextTier, tierMissing, tierTax } from '../../src/sim/discharge';
import { closeProposal, decline, fitLevel, fitOf } from '../../src/sim/proposals';
import { activeNeeds, effort, statusLine, unlockedActivities } from '../../src/sim/selectors';
import { selectedResident, type GameState, type Resident } from '../../src/sim/state';
import { TICKS_PER_SECOND, formatDate } from '../../src/sim/time';
import { act, useGame } from '../../src/store';
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

/** Need art from icons.aseprite. */
const NEED_ART: Record<NeedId, IconName> = {
  food: 'hunger',
  hygiene: 'hygiene',
  energy: 'sleep',
  home: 'home',
  social: 'social',
};

/** Action art from icons.aseprite. */
const ACTION_ART: Record<ActivityId, IconName> = {
  eat: 'bread',
  shower: 'shower',
  sleep: 'bed',
  dishes: 'dishes',
  laundry: 'laundry',
  tidy: 'tidy',
  groceries: 'groceries',
  walk: 'walk',
  call: 'phone',
};

function NeedIcon({ n }: { n: NeedId }) {
  return <img class="art" src={ICONS[NEED_ART[n]]} alt="" />;
}

function ActionIcon({ id }: { id: ActivityId }) {
  return <img class="art" src={ICONS[ACTION_ART[id]]} alt="" />;
}

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
  const [inspect, setInspectRaw] = useState<number | null>(null);
  const [tab, setTabRaw] = useState<Tab | null>(null);
  // The character window and the furniture panel overlap, so one closes the other.
  const setTab = (t: Tab | null) => {
    if (t && !tab) pause();
    if (!t && tab) resume();
    setTabRaw(t);
    if (t) setInspectRaw(null);
  };
  const setInspect = (i: number | null) => {
    setInspectRaw(i);
    if (i !== null) setTab(null);
  };
  const [dragging, setDragging] = useState(false);
  const loadouts = useLoadouts();
  const r = selectedResident(s);
  const loadout = r ? loadouts.get(s.selected, r) : [];
  const place = (id: ActivityId, slot: number) => r && loadouts.place(s.selected, r, id, slot);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setInspect(null);
      setTab(null);
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [tab]);
  return (
    <div class="screen" style={{ zoom: String(zoom) }}>
      {/* A still from the Lifelines prototype, in place of the 3D house. */}
      <div class="stage">
        <img class="room" src={room} alt="" onClick={() => setInspect(null)} />
        {r && <SceneBubble r={r} />}
        {r && <FurnitureSpots r={r} loadout={loadout} open={inspect} setOpen={setInspect} />}
      </div>
      <Roster s={s} open={tab !== null} toggle={() => setTab(tab ? null : 'needs')} />
      {tab === null && <PatientPanel r={r} open={() => setTab('needs')} />}
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
      {r && tab && <CharacterWindow s={s} r={r} tab={tab} setTab={setTab} />}
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
function Roster(props: { s: GameState; open: boolean; toggle: () => void }) {
  const { s, open, toggle } = props;
  return (
    <nav class="roster">
      {s.beds.map((b, i) => (
        <button
          class={`face${i === s.selected ? ' picked' : ''}${b ? '' : ' empty'}${i === s.selected && open ? ' open' : ''}`}
          onClick={() =>
            // A click on the selected patient opens or closes the character window. Another
            // patient keeps the window as it is.
            b && i === s.selected
              ? toggle()
              : act((g) => {
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

/** The needs and overskudd on the left edge. A click opens the character window. */
function PatientPanel({ r, open }: { r: Resident | null; open: () => void }) {
  if (!r) return null;
  return (
    <section class="patient" onClick={open} title="Open the character window">
      <NeedRows r={r} />
    </section>
  );
}

/** One row per need and one for overskudd: the icon on the left, the name over the bar. */
function NeedRows({ r, low }: { r: Resident; low?: boolean }) {
  return (
    <>
      {NEED_ORDER.filter((n) => activeNeeds(r).includes(n)).map((n) => (
        <div class="need" key={n}>
          <span class="need-art">
            <NeedIcon n={n} />
          </span>
          <span class="label">
            {NEEDS[n].label}
            {low && r.needs[n] < NEED_THRESHOLD && (
              <span class="low-state"> {NEEDS[n].lowState}</span>
            )}
          </span>
          <KitBar piece="bar-need" state={needState(r.needs[n])} value={r.needs[n] / 100} />
        </div>
      ))}
      {/* The arrow, as over the buttons: overskudd pays for training. */}
      <div class="need overskudd" title="Overskudd: spent on training">
        <span class="need-art">
          <img class="art" src={ICONS.overskudd} alt="" />
        </span>
        <span class="label">Overskudd {Math.floor(r.overskudd)}</span>
        <KitBar piece="bar-overskudd" value={r.overskudd / OVERSKUDD_CAP} />
      </div>
    </>
  );
}

function needState(v: number): string {
  if (v < NEED_THRESHOLD / 2) return 'emergency';
  if (v < NEED_THRESHOLD) return 'warning';
  if (v < 60) return 'neutral';
  return 'good';
}

// ---------- Left: the character window ----------

type Tab = 'needs' | 'profile' | 'story';

// TODO(Terje): placeholder tab names, layer names and profile part names, from PLAN.md.
const TABS: { id: Tab; label: string }[] = [
  { id: 'needs', label: 'Needs' },
  { id: 'profile', label: 'Profile' },
  { id: 'story', label: 'Story' },
];

/** The Maslow layers, top first, as the pyramid draws them. */
const LAYERS: { label: string; needs?: NeedId[]; phases?: Phase[] }[] = [
  { label: 'Purpose', phases: ['purpose'] },
  { label: 'Esteem', phases: ['identity', 'mastery'] },
  { label: 'Belonging', needs: ['social'] },
  { label: 'Security', needs: ['home'] },
  { label: 'Body', needs: ['food', 'hygiene', 'energy'] },
];

/**
 * Rough: the sim has no layers yet. A need layer counts as reached when each of its needs has an
 * independent action. The esteem and purpose layers count milestone successes.
 */
function layerReached(r: Resident, l: (typeof LAYERS)[number]): boolean {
  if (l.phases)
    return l.phases.every((p) => r.milestones.some((m) => MILESTONE_BY_ID[m].phase === p));
  return l.needs!.every((n) =>
    unlockedActivities(r).some((a) => a.refills[n] && effort(r, a.id) === 0),
  );
}

function pause() {
  act((g) => {
    g.resumeSpeed = g.speed || g.resumeSpeed;
    g.speed = 0;
  });
}

function resume() {
  // A proposal or a vedtak keeps the game paused.
  act((g) => (g.speed = g.proposal || g.discharge ? 0 : g.resumeSpeed));
}

/**
 * Everything about one patient in one window over the left edge. It grows from the needs panel, so
 * the needs stay in the same place. The game pauses while it is open.
 */
function CharacterWindow(props: {
  s: GameState;
  r: Resident;
  tab: Tab;
  setTab: (t: Tab | null) => void;
}) {
  const { s, r, tab, setTab } = props;
  return (
    <section class="kit-window character">
      <header class="c-head">
        <span class="c-face">
          {PORTRAIT[r.name] ? (
            <img src={PORTRAIT[r.name]} alt="" />
          ) : (
            <span class="initial">{r.name[0]}</span>
          )}
        </span>
        <span class="title">{r.name}</span>
        <span class="c-tags">
          <Identity s={s} r={r} />
          {r.trait && (
            <span class="tag" title={TRAIT_BY_ID[r.trait].effect}>
              {TRAIT_BY_ID[r.trait].label}
            </span>
          )}
        </span>
        <button class="kit-button-quiet c-close" onClick={() => setTab(null)} title="Close (Esc)">
          x
        </button>
      </header>
      <nav class="c-tabs">
        {TABS.map((t) => (
          <button
            class={t.id === tab ? 'kit-button-2' : 'kit-button-quiet'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div class="c-body">
        {tab === 'needs' && <NeedsTab r={r} />}
        {tab === 'profile' && <ProfileTab s={s} r={r} />}
        {tab === 'story' && <StoryTab r={r} />}
      </div>
    </section>
  );
}

/** The identity chip, split between two colours. A "?" until the player can see it. */
function Identity({ s, r }: { s: GameState; r: Resident }) {
  if (!identitiesShown(s)) return <span class="tag muted">?</span>;
  const id = r.identity;
  return (
    <span
      class="tag chip"
      style={{
        '--a': COLOUR_CSS[id.primary],
        '--b': COLOUR_CSS[id.secondary ?? id.primary],
      }}
    >
      {identityLabel(id)}
    </span>
  );
}

function NeedsTab({ r }: { r: Resident }) {
  const needs = activeNeeds(r);
  const green = needs.filter((n) => r.needs[n] >= NEED_THRESHOLD).length / needs.length;
  return (
    <>
      <span class="muted">{statusLine(r)}</span>
      <NeedRows r={r} low />
      <ul class="c-effects">
        {green < 1 && <li>{RESIDENT.growing(Math.round(green * 100)).replace(' · ', '')}</li>}
        {(r.boost ?? 0) > 0 && (
          <li class="good">{RESIDENT.boost(Math.round(r.boost! * 100)).replace(' · ', '')}</li>
        )}
        {r.strain > 0.005 && <li class="bad">{RESIDENT.strain(Math.round(r.strain * 100))}</li>}
      </ul>
    </>
  );
}

/** The layers as a pyramid, and the five profile parts with a test for each one still closed. */
function ProfileTab({ s, r }: { s: GameState; r: Resident }) {
  const arch = ARCHETYPE_BY_ID[r.archetype];
  const good = unlockedActivities(r).filter((a) => r.skill[a.id] > 0);
  const best = bestTier(r);
  const parts: { label: string; layer: string; open: boolean; body: preact.ComponentChildren }[] = [
    {
      label: 'Good at',
      layer: 'Body',
      open: layerReached(r, LAYERS[4]!),
      body: (
        <span class="c-icons">
          {good.map((a) => (
            <span title={a.label}>
              <ActionIcon id={a.id} />
              {r.skill[a.id]}
            </span>
          ))}
          {arch.hard.map((id) => (
            <span class="bad" title={`${ACTIVITY_BY_ID[id].label} is hard`}>
              <ActionIcon id={id} />
              x2
            </span>
          ))}
        </span>
      ),
    },
    { label: 'Loves', layer: 'Security', open: false, body: 'Not in the sim yet' },
    {
      label: 'Who they are',
      layer: 'Belonging',
      open: identitiesShown(s),
      body: <Identity s={s} r={r} />,
    },
    { label: 'World needs', layer: 'Esteem', open: false, body: 'Not in the sim yet' },
    {
      label: 'Paid for',
      layer: 'Purpose',
      open: best !== null,
      body: best && `${best.label}, ${UNITS.plusKrPerW(tierTax(r, best.id))}`,
    },
  ];
  return (
    <>
      <div class="pyramid">
        {LAYERS.map((l, i) => (
          <span
            class={`layer${layerReached(r, l) ? ' reached' : ''}`}
            style={{ width: `${60 + i * 25}px` }}
          >
            {l.label}
          </span>
        ))}
      </div>
      <ul class="parts">
        {parts.map((p) => (
          <li class={p.open ? 'part' : 'part closed'}>
            <span class="label">{p.label}</span>
            {p.open ? (
              <span>{p.body}</span>
            ) : (
              <>
                <span class="muted">opens with {p.layer.toLowerCase()}</span>
                <button class="kit-button-1 test" disabled title="Tests are not built yet">
                  Test
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Who they are, how far they have come, every try, and what discharge pays. */
function StoryTab({ r }: { r: Resident }) {
  const tries = r.tries ?? r.milestones.map((id) => ({ id, won: true }));
  const best = bestTier(r);
  const better = nextTier(r);
  return (
    <>
      <p class="intro">{r.intro}</p>
      <div class="phases">
        {PHASES.map((p) => {
          const done = r.milestones.some((m) => MILESTONE_BY_ID[m].phase === p);
          return <span class={done ? 'phase done' : 'phase'}>{PHASE_LABEL[p]}</span>;
        })}
      </div>
      {tries.length > 0 && (
        <ul class="tries">
          {tries.map((x) => {
            const m = MILESTONE_BY_ID[x.id];
            const face =
              REACTION_FACE[x.won ? 'success' : 'failure'][fitLevel(fitOf(r.identity, x.id))];
            return (
              <li class={x.won ? 'good' : 'bad'}>
                {m.placeIcon} {m.label} {face}
              </li>
            );
          })}
        </ul>
      )}
      <div class="c-discharge">
        {best && (
          <button class="kit-button-1" disabled title="Discharge in the main game">
            {RESIDENT.discharge(best.label)} {UNITS.plusKrPerW(tierTax(r, best.id))}
          </button>
        )}
        {better && (
          <span class="muted">
            {RESIDENT.nextTier(better.label, tierTax(r, better.id), tierMissing(r, better.id))}
          </span>
        )}
      </div>
    </>
  );
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
        <span class="icon">
          <ActionIcon id={a.id} />
        </span>
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
      <span class="tip-icon">
        <ActionIcon id={a.id} />
      </span>
      <span class="title">{a.label}</span>
      <span class="lvl muted">lvl {skill + 1}</span>
      <span class="muted">{a.duration} sec</span>
      <span class="refills">
        {NEED_ORDER.filter((n) => a.refills[n]).map((n) => (
          <span class="refill">
            <span class="need-icon">
              <NeedIcon n={n} />
            </span>
            +{a.refills[n]}
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
              <span class="mini-disc">
                <ActionIcon id={a.id} />
              </span>
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
        <ActionIcon id={a.id} />
      </span>
      <span class="title">{a.label}</span>
      {open && <span class="lvl muted">lvl {skill + 1}</span>}
      <span class="muted">{a.duration} sec duration</span>
      <span class="refills">
        {NEED_ORDER.filter((n) => a.refills[n]).map((n) => (
          <span class="refill">
            <span class="need-icon">
              <NeedIcon n={n} />
            </span>
            +{a.refills[n]}
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
              {id ? <ActionIcon id={id} /> : i + 1}
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
