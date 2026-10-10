import { netIncomePerWeek, omsorgCap } from '../sim/institution';
import { isSeen } from '../sim/reveal';
import { formatDate } from '../sim/time';
import { act, useGame } from '../store';

export function TopBar() {
  const s = useGame();
  const cap = omsorgCap(s);
  const net = netIncomePerWeek(s);
  return (
    <header class="topbar">
      <div class="date chip">{formatDate(s.tick)}</div>
      <button
        class={s.speed === 0 ? 'play-toggle paused' : 'play-toggle'}
        aria-label={s.speed === 0 ? 'Play' : 'Pause'}
        onClick={() => act((g) => (g.speed = g.speed === 0 ? 1 : 0))}
      >
        {s.speed === 0 ? '▶' : '❚❚'}
      </button>
      <div class="omsorg" data-tip="omsorg">
        <span class="label">Omsorg</span>
        <div class="meter">
          <div class="fill" style={{ width: `${(s.omsorg / cap) * 100}%` }} />
        </div>
        <span class="value">
          {Math.floor(s.omsorg)}/{cap}
        </span>
      </div>
      <div class="budget chip">
        {Math.floor(s.budget)} kr{' '}
        <span class="muted">
          {net >= 0 ? '+' : ''}
          {net}/w
        </span>
      </div>
      {isSeen(s, 'beds') && (
        <>
          <div class="chip" title="Helped">
            👷 {s.discharged.length}
          </div>
          <div class="chip" title="Lost">
            💀 {s.lost}
          </div>
        </>
      )}
    </header>
  );
}
