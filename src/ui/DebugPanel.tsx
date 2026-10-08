import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { ACTIVITIES } from '../content/activities';
import { MILESTONES } from '../content/milestones';
import { NEED_ORDER } from '../content/needs';
import { DEBUG_SPEEDS, MAX_SKILL } from '../content/tuning';
import { omsorgCap } from '../sim/institution';
import type { Resident } from '../sim/state';
import { act, resetGame } from '../store';

const open = signal(false);

/** Run a change on the resident in the selected bed, if there is one. */
const onSelected = (fn: (r: Resident) => void) =>
  act((g) => {
    const r = g.beds[g.selected];
    if (r) fn(r);
  });

// Toggle with the backtick key.
export function DebugPanel() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') open.value = !open.value;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button class="debug-toggle" onClick={() => (open.value = !open.value)} aria-label="Debug">
        ⚙
      </button>
      {open.value && (
        <aside class="debug">
          <strong>Debug</strong>
          <div class="row">
            {DEBUG_SPEEDS.map((sp) => (
              <button onClick={() => act((g) => (g.speed = sp))}>{sp}x</button>
            ))}
          </div>
          <div class="row">
            <button onClick={() => act((g) => (g.omsorg = omsorgCap(g)))}>Fill omsorg</button>
            <button onClick={() => act((g) => (g.budget += 1000))}>+1000 kr</button>
            <button
              onClick={() =>
                onSelected((r) => {
                  r.overskudd = 60;
                  r.lastProposalTick = -1e9;
                })
              }
            >
              Proposal now
            </button>
            <button
              onClick={() => onSelected((r) => NEED_ORDER.forEach((n) => (r.needs[n] = 100)))}
            >
              Fill needs
            </button>
          </div>
          <div class="row">
            <button
              onClick={() =>
                onSelected((r) => {
                  for (const a of ACTIVITIES) r.skill[a.id] = MAX_SKILL;
                  r.unlockedRung = ACTIVITIES.length;
                })
              }
            >
              All automatic
            </button>
            <button
              onClick={() =>
                onSelected((r) => {
                  const m = MILESTONES.find((x) => !r.milestones.includes(x.id));
                  if (m) r.milestones.push(m.id);
                })
              }
            >
              Next milestone
            </button>
          </div>
          <div class="row">
            <button onClick={resetGame}>Reset save</button>
          </div>
          <p class="muted">Build {__BUILD_TIME__}</p>
        </aside>
      )}
    </>
  );
}
