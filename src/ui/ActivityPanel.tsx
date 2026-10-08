import type { ActivityDef } from '../content/activities';
import { NEEDS } from '../content/needs';
import { MAX_SKILL, READY_BELOW, barSize, trainCost } from '../content/tuning';
import { canNudge, canTrain, nudge, train } from '../sim/actions';
import { readyQueue, unlockedActivities } from '../sim/selectors';
import { TICKS_PER_SECOND } from '../sim/time';
import { act, useGame } from '../store';

export function ActivityPanel() {
  const s = useGame();
  const r = s.resident;
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
  const r = s.resident;
  const skill = r.skill[a.id];
  const size = barSize(skill);
  const auto = size === 0;
  const filled = r.bars[a.id];
  const doing = r.current?.id === a.id;
  const progress =
    doing && r.current ? 1 - r.current.remaining / (a.duration * TICKS_PER_SECOND) : 0;
  const need = NEEDS[a.trigger].label.toLowerCase();

  let note: string;
  if (doing) note = 'Doing it now';
  else if (priority > 0 && r.needs[a.trigger] < READY_BELOW) note = 'Up next';
  else if (priority > 0) note = `Waits until ${need} is below ${READY_BELOW}`;
  else note = `${size - filled} nudges to go`;

  const classes = ['card', doing && 'doing', priority > 0 && 'ready', auto && 'auto']
    .filter(Boolean)
    .join(' ');

  const nudgeable = canNudge(s, a.id);
  // A div, not a button: the train button sits inside the card.
  return (
    <div
      class={classes}
      role="button"
      tabIndex={auto ? -1 : 0}
      aria-disabled={!nudgeable}
      onClick={() => act((g) => nudge(g, a.id))}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        act((g) => nudge(g, a.id));
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
        <span class="foot">
          <span class="note">{note}</span>
          {!auto && <TrainButton activity={a} />}
        </span>
      </span>
    </div>
  );
}

/** Level label and an arrow that spends overskudd on the next level. */
function TrainButton({ activity: a }: { activity: ActivityDef }) {
  const s = useGame();
  const skill = s.resident.skill[a.id];
  const next = skill + 1;
  const effect =
    next >= MAX_SKILL ? 'becomes automatic' : `${barSize(skill)} → ${barSize(next)} nudges`;
  return (
    <span class="level">
      <span class="lvl">lvl {next}</span>
      <button
        class="train"
        disabled={!canTrain(s, a.id)}
        title={`Train for ${trainCost(skill)} overskudd: ${effect}`}
        aria-label={`Train ${a.label} for ${trainCost(skill)} overskudd: ${effect}`}
        onClick={(e) => {
          // Keep the click from nudging the card.
          e.stopPropagation();
          act((g) => train(g, a.id));
        }}
      >
        {trainCost(skill)}
      </button>
    </span>
  );
}
