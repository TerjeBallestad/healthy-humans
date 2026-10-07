import type { ActivityDef } from '../content/activities';
import { barSize } from '../content/tuning';
import { canNudge, nudge } from '../sim/actions';
import { act, useGame } from '../store';

export function NudgeBar({ activity }: { activity: ActivityDef }) {
  const s = useGame();
  const r = s.resident;
  const size = barSize(r.skill[activity.id]);
  const filled = r.bars[activity.id];
  const doing = r.current?.id === activity.id;
  const waiting = !doing && size > 0 && filled >= size;

  let note = `${filled} / ${size}`;
  if (doing) note = 'doing it';
  else if (waiting) note = 'ready';
  else if (size === 0) note = 'handles this themselves';

  return (
    <button
      class={doing ? 'nudge doing' : waiting ? 'nudge waiting' : 'nudge'}
      disabled={!canNudge(s, activity.id)}
      onClick={() => act((g) => nudge(g, activity.id))}
    >
      <div class="fill" style={{ width: `${doing ? 100 : (filled / size) * 100}%` }} />
      <span class="label">{activity.label}</span>
      <span class="note">{note}</span>
    </button>
  );
}
