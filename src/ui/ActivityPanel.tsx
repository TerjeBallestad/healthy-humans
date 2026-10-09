import type { ActivityDef } from '../content/activities';
import { MAX_SKILL, trainCost } from '../content/tuning';
import { canNudge, canTrain, nudge, train } from '../sim/actions';
import { effort, readyQueue, unlockedActivities } from '../sim/selectors';
import { TICKS_PER_SECOND } from '../sim/time';
import { selectedResident } from '../sim/state';
import { act, useGame } from '../store';

export function ActivityPanel() {
  const s = useGame();
  const r = selectedResident(s);
  if (!r) return null;
  const queue = readyQueue(r);
  return (
    <section class="panel activities">
      <h3>Activities</h3>
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
        <span class="icon" aria-hidden="true">
          {a.icon}
        </span>
        {auto ? (
          <span class="nudge-label">alone</span>
        ) : (
          <>
            <span class="meter effort" title="Effort: nudges until ready">
              <span class="fill" style={{ width: `${(filled / size) * 100}%` }} />
            </span>
            <span class="nudge-label">
              {filled}/{size}
            </span>
          </>
        )}
      </span>
      <span class="body">
        <span class="title">{a.label}</span>
        <span class="meter progress" title="The activity in progress">
          <span class="fill" style={{ width: `${progress * 100}%` }} />
        </span>
        <span class="foot">{!auto && <TrainButton activity={a} />}</span>
      </span>
    </div>
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
      ? 'becomes automatic'
      : `${effort(r, a.id)} → ${effort(r, a.id, next)} nudges`;
  return (
    <span class="level">
      <span class="lvl">lvl {next}</span>
      <button
        class="train"
        disabled={!canTrain(s, bed, a.id)}
        title={`Train for ${trainCost(skill)} overskudd: ${effect}`}
        aria-label={`Train ${a.label} for ${trainCost(skill)} overskudd: ${effect}`}
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
