import { useEffect, useRef } from 'preact/hooks';
import type { ActivityDef } from '../content/activities';
import { NEEDS } from '../content/needs';
import { COMPLETIONS_PER_LEVEL, MAX_SKILL, READY_BELOW, barSize } from '../content/tuning';
import { canNudge, nudge } from '../sim/actions';
import { readyQueue, unlockedActivities } from '../sim/selectors';
import { act, useGame } from '../store';

/** Hold a card this long before nudges repeat. */
const HOLD_DELAY_MS = 300;
const REPEAT_MS = 90;

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
  const progress = doing && r.current ? 1 - r.current.remaining / a.duration : 0;
  const hold = useHold(() => act((g) => nudge(g, a.id)));
  const need = NEEDS[a.trigger].label.toLowerCase();

  let note: string;
  if (doing) note = 'Doing it now';
  else if (priority > 0 && r.needs[a.trigger] < READY_BELOW) note = 'Up next';
  else if (priority > 0) note = `Waits until ${need} is below ${READY_BELOW}`;
  else note = `${size - filled} nudges to go`;

  const classes = ['card', doing && 'doing', priority > 0 && 'ready', auto && 'auto']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      class={classes}
      disabled={!canNudge(s, a.id)}
      onPointerDown={hold.start}
      onPointerLeave={hold.stop}
      // Keyboard only. Pointer presses nudge in onPointerDown.
      onClick={(e) => e.detail === 0 && act((g) => nudge(g, a.id))}
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
        <span class="title">
          {a.label}
          <span class="pips" aria-label={`Skill ${skill} of ${MAX_SKILL}`}>
            {Array.from({ length: MAX_SKILL }, (_, i) => (i < skill ? '●' : '○')).join('')}
          </span>
        </span>
        <span class="meter progress" title="The activity in progress">
          <span class="fill" style={{ width: `${progress * 100}%` }} />
        </span>
        {!auto && (
          <span class="xp meter" title="Practice toward the next skill level">
            <span
              class="fill"
              style={{ width: `${(r.xp[a.id] / COMPLETIONS_PER_LEVEL) * 100}%` }}
            />
          </span>
        )}
        <span class="note">{note}</span>
      </span>
    </button>
  );
}

/** Calls fn on press, then again and again while the press lasts. */
function useHold(fn: () => void) {
  const timer = useRef<number | undefined>(undefined);
  const stop = () => {
    clearTimeout(timer.current);
    clearInterval(timer.current);
    timer.current = undefined;
  };
  const start = (e: PointerEvent) => {
    if (e.button !== 0) return;
    stop();
    // A button that turns disabled gets no pointerup, so listen on the window.
    window.addEventListener('pointerup', stop, { once: true });
    window.addEventListener('pointercancel', stop, { once: true });
    fn();
    timer.current = window.setTimeout(() => {
      timer.current = window.setInterval(fn, REPEAT_MS);
    }, HOLD_DELAY_MS);
  };
  useEffect(() => stop, []);
  return { start, stop };
}
