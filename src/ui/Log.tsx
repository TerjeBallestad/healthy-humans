import { formatClock } from '../sim/time';
import { useGame } from '../store';

const SHOWN = 8;

export function Log() {
  const s = useGame();
  return (
    <ol class="log">
      {s.log.slice(0, SHOWN).map((e) => (
        <li>
          <span class="muted">{formatClock(e.minute)}</span> {e.text}
        </li>
      ))}
    </ol>
  );
}
