import { formatDate } from '../sim/time';
import { useGame } from '../store';

const SHOWN = 8;

export function Log() {
  const s = useGame();
  return (
    <ol class="panel log">
      {s.log.slice(0, SHOWN).map((e) => (
        <li>
          <span class="muted">{formatDate(e.tick)}</span> {e.text}
        </li>
      ))}
    </ol>
  );
}
