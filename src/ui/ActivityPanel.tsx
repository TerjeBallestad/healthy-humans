import type { ActivityDef } from '../content/activities';
import { MAX_SKILL, trainCost } from '../content/tuning';
import { canNudge, canTrain, nudge, train } from '../sim/actions';
import { effort, readyQueue, unlockedActivities } from '../sim/selectors';
import { TICKS_PER_SECOND } from '../sim/time';
import { selectedResident } from '../sim/state';
import { act, useGame } from '../store';
import { ACTIVITY_PANEL, UNITS } from '../content/text';

export function ActivityPanel() {
  const s = useGame();
  const r = selectedResident(s);
  if (!r) return null;
  const queue = readyQueue(r);
  return (
    <section class="panel activities">
      <h3>{ACTIVITY_PANEL.heading}</h3>
      <div class="cards">
        {unlockedActivities(r).map((a) => (
          <ActivityCard activity={a} priority={queue.indexOf(a) + 1} />
        ))}
      </div>
    </section>
  );
}

function ActivityCard({ activity: a, priority }: { activity: ActivityDef; priority: number }) {
  const s = useGame();
  const bed = s.selected;
  const r = s.beds[bed]!;
  const size = effort(r, a.id);
  const auto = size === 0;
  const filled = r.bars[a.id];
  const hit = r.staffHit[a.id];
  const doing = r.current?.id === a.id;
  const progress =
    doing && r.current ? 1 - r.current.remaining / (a.duration * TICKS_PER_SECOND) : 0;
  const classes = ['card', doing && 'doing', priority > 0 && 'ready', auto && 'auto']
    .filter(Boolean)
    .join(' ');

  const nudgeable = canNudge(s, bed, a.id);
  // A div, not a button: the train button sits inside the card.
  return (
    <div
      class={classes}
      data-tip={`act-${a.id}`}
      role="button"
      tabIndex={auto ? -1 : 0}
      aria-disabled={!nudgeable}
      onClick={() => act((g) => nudge(g, bed, a.id))}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        act((g) => nudge(g, bed, a.id));
      }}
    >
      {priority > 0 && <span class="priority">#{priority}</span>}
      <span class="left">
        <span class="ring-wrap">
          {!auto && <EffortRing size={size} filled={filled} />}
          {hit && s.tick - hit.tick < STAFF_POP_TICKS && (
            <span key={hit.tick} class="staff-pop" title={hit.who}>
              {hit.who[0]}
            </span>
          )}
          <span class="icon" aria-hidden="true">
            {a.icon}
          </span>
        </span>
        <span class="nudge-label">{auto ? UNITS.independent : `${filled}/${size}`}</span>
      </span>
      <span class="body">
        <span class="title">{a.label}</span>
        <span class="meter progress" title={ACTIVITY_PANEL.inProgress}>
          <span class="fill" style={{ width: `${progress * 100}%` }} />
        </span>
        <span class="foot">{!auto && <TrainButton activity={a} />}</span>
      </span>
    </div>
  );
}

/** How long a staff member's initial shows on the ring after a nudge. */
const STAFF_POP_TICKS = TICKS_PER_SECOND * 0.8;

const RING = 64;
const RADIUS = 29;

/** One arc per nudge around the icon. A long ring of thin segments means a costly activity. */
function EffortRing({ size, filled }: { size: number; filled: number }) {
  const step = (2 * Math.PI) / size;
  // The gap is a fixed length on the ring, so many segments still read as separate.
  const gap = Math.min(step * 0.35, 2.2 / RADIUS);
  const point = (angle: number) =>
    `${RING / 2 + RADIUS * Math.sin(angle)} ${RING / 2 - RADIUS * Math.cos(angle)}`;
  return (
    <svg class="ring" viewBox={`0 0 ${RING} ${RING}`} aria-hidden="true">
      {Array.from({ length: size }, (_, i) => {
        const from = i * step + gap / 2;
        const to = (i + 1) * step - gap / 2;
        return (
          <path
            class={i < filled ? 'seg on' : 'seg'}
            d={`M ${point(from)} A ${RADIUS} ${RADIUS} 0 0 1 ${point(to)}`}
          />
        );
      })}
    </svg>
  );
}

/** Level label and an arrow that spends overskudd on the next level. */
function TrainButton({ activity: a }: { activity: ActivityDef }) {
  const s = useGame();
  const bed = s.selected;
  const r = s.beds[bed]!;
  const skill = r.skill[a.id];
  const next = skill + 1;
  const effect =
    next >= MAX_SKILL
      ? ACTIVITY_PANEL.becomesAutomatic
      : ACTIVITY_PANEL.nudges(effort(r, a.id), effort(r, a.id, next));
  return (
    <span class="level">
      <span class="lvl">{UNITS.level(next)}</span>
      <button
        class="train"
        data-tip={`train-${a.id}`}
        disabled={!canTrain(s, bed, a.id)}
        title={ACTIVITY_PANEL.trainTitle(trainCost(skill), effect)}
        aria-label={ACTIVITY_PANEL.trainLabel(a.label, trainCost(skill), effect)}
        onClick={(e) => {
          // Keep the click from nudging the card.
          e.stopPropagation();
          act((g) => train(g, bed, a.id));
        }}
      >
        {trainCost(skill)}
      </button>
    </span>
  );
}
