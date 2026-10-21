// The layout prototype: the real game at the 960×540 base, built from Terje's kit.
// Top left: the patient (beds, needs, overskudd). Top: time, omsorg, budget. Top right: menus.
// Left edge: categories, one per need. Bottom: the actions in the chosen category.
// The middle stays free for the house.
import { useEffect, useState } from 'preact/hooks';
import { ACTIVITIES, type ActivityDef } from '../../src/content/activities';
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

const W = 960;
const H = 540;

/** Placeholder icons until icon set 1 exists. */
const NEED_ICON: Record<NeedId, string> = {
  food: '🍞',
  hygiene: '🚿',
  energy: '🛏️',
  home: '🧹',
  social: '📞',
};

type Category = NeedId | 'all';

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

export function App() {
  const s = useGame();
  const zoom = useZoom();
  const [category, setCategory] = useState<Category>('all');
  const r = selectedResident(s);
  return (
    <div class="screen" style={{ zoom: String(zoom) }}>
      <div class="stage">
        <span class="stage-label">The house</span>
        {r && (
          <div class="kit-card bubble" data-state="subtle">
            {statusLine(r)}
          </div>
        )}
      </div>
      <PatientPanel s={s} r={r} />
      <TopBar s={s} />
      <Menus />
      {r && <Rail r={r} s={s} category={category} setCategory={setCategory} />}
      {r && <ActionBar r={r} s={s} category={category} />}
      {s.proposal && <ProposalStub s={s} />}
    </div>
  );
}

// ---------- Top left: the patient ----------

function PatientPanel({ s, r }: { s: GameState; r: Resident | null }) {
  return (
    <section class="kit-window patient">
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
          <div class="meter-row">
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

// ---------- Top: time, omsorg, budget ----------

function TopBar({ s }: { s: GameState }) {
  const cap = omsorgCap(s);
  return (
    <section class="kit-card topbar" data-state="subtle">
      <button
        class="kit-button-quiet"
        onClick={() => act((g) => (g.speed = g.speed === 0 ? 1 : 0))}
        title={s.speed === 0 ? 'Play' : 'Pause'}
      >
        {s.speed === 0 ? 'Play' : 'Pause'}
      </button>
      <span>{formatDate(s.tick)}</span>
      <span class="sep" />
      <span class="label">Omsorg</span>
      {/* Placeholder: the kit has no omsorg (mana) bar yet. */}
      <KitBar piece="bar-health" value={s.omsorg / cap} />
      <span class="num">
        {Math.floor(s.omsorg)}/{cap}
      </span>
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

// ---------- Left edge: categories ----------

function inCategory(a: ActivityDef, c: Category) {
  return c === 'all' || a.trigger === c;
}

function Rail(props: {
  s: GameState;
  r: Resident;
  category: Category;
  setCategory: (c: Category) => void;
}) {
  const { s, r, category, setCategory } = props;
  const unlocked = unlockedActivities(r);
  const ready = readyQueue(r);
  const items: { id: Category; icon: string; label: string }[] = [
    { id: 'all', icon: '✦', label: 'All' },
    ...NEED_ORDER.map((n) => ({ id: n, icon: NEED_ICON[n], label: NEEDS[n].label })),
  ];
  return (
    <nav class="rail">
      {items.map((c) => {
        const acts = unlocked.filter((a) => inCategory(a, c.id));
        const low =
          c.id !== 'all' && activeNeeds(r).includes(c.id) && r.needs[c.id] < NEED_THRESHOLD;
        const count = acts.filter((a) => ready.includes(a) || canTrain(s, s.selected, a.id)).length;
        return (
          <button
            class={`kit-card cat${low ? ' low' : ''}`}
            data-state={!acts.length ? 'disabled' : category === c.id ? 'selected' : 'subtle'}
            disabled={!acts.length}
            title={c.label}
            onClick={() => setCategory(c.id)}
          >
            <span class="icon">{c.icon}</span>
            {count > 0 && <span class="badge">{count}</span>}
          </button>
        );
      })}
    </nav>
  );
}

// ---------- Bottom: actions ----------

function ActionBar({ s, r, category }: { s: GameState; r: Resident; category: Category }) {
  const queue = readyQueue(r);
  const shown = unlockedActivities(r).filter((a) => inCategory(a, category));
  // Locked rungs in this category show as a teaser, dim, as in the Wildermark bar.
  const next = ACTIVITIES.find((a) => a.rung > r.unlockedRung && inCategory(a, category));
  return (
    <section class="actions">
      {shown.map((a) => (
        <ActionCard s={s} r={r} a={a} priority={queue.indexOf(a) + 1} key={a.id} />
      ))}
      {next && (
        <div class="kit-card act" data-state="disabled">
          <div class="head">
            <span class="icon">{next.icon}</span>
            <span class="title">{next.label}</span>
          </div>
          <span class="muted">Opens when the last rung is independent</span>
        </div>
      )}
    </section>
  );
}

function ActionCard({
  s,
  r,
  a,
  priority,
}: {
  s: GameState;
  r: Resident;
  a: ActivityDef;
  priority: number;
}) {
  const bed = s.selected;
  const size = effort(r, a.id);
  const auto = size === 0;
  const doing = r.current?.id === a.id;
  const progress =
    doing && r.current ? 1 - r.current.remaining / (a.duration * TICKS_PER_SECOND) : 0;
  const skill = r.skill[a.id];
  // Queued (bar full, waiting to start) glows, the running one is outlined, the rest stay quiet.
  const state = doing ? 'selected' : priority > 0 ? 'hover' : 'subtle';
  const starved = !auto && !canNudge(s, bed, a.id) && r.bars[a.id] < size;
  const go = () => act((g) => nudge(g, bed, a.id));
  return (
    <div
      class="kit-card act"
      data-state={state}
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go())}
    >
      <div class="head">
        <span class="icon">{a.icon}</span>
        <span class="title">{a.label}</span>
        <span class="tag">{doing ? 'doing' : priority > 0 ? `#${priority}` : ''}</span>
      </div>
      {auto ? (
        <span class="muted">Independent</span>
      ) : (
        <div class={starved ? 'effort starved' : 'effort'}>
          <Pips size={size} filled={r.bars[a.id]} />
          <span class="num">
            {r.bars[a.id]}/{size}
          </span>
        </div>
      )}
      <div class="progress">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
      {!auto && (
        <div class="foot">
          <span class="muted">lvl {skill + 1}</span>
          <button
            class="kit-button-1"
            disabled={!canTrain(s, bed, a.id)}
            title={
              skill + 1 >= MAX_SKILL
                ? 'Becomes automatic'
                : `${size} → ${effort(r, a.id, skill + 1)} nudges`
            }
            onClick={(e) => {
              e.stopPropagation();
              act((g) => train(g, bed, a.id));
            }}
          >
            Train {trainCost(skill)}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The nudges as a row of pips, in place of the effort ring: a straight row stays crisp in pixel
 * art at any count, where a ring of 12 or 24 segments does not. Placeholder CSS until Terje draws
 * a pip sprite.
 */
function Pips({ size, filled }: { size: number; filled: number }) {
  return (
    <span class={`pips${size > 12 ? ' small' : ''}`}>
      {Array.from({ length: size }, (_, i) => (
        <span class={i < filled ? 'pip on' : 'pip'} />
      ))}
    </span>
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
