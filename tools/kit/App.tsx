// The UI kit gallery: every piece in every state, at the base resolution, in the game font.
// UI rule 4 in GODOT.md: polish the pieces here, then build screens from finished pieces.
import { useEffect, useState } from 'preact/hooks';
import { KitBar, KitRing } from '../../src/kit/components';
import { FONTS, PIECES } from '../../src/kit/manifest';

const FALLBACK = 'ui-monospace, Menlo, monospace';

function useZoom(): [number, (z: number) => void] {
  const fit = () => Math.max(1, Math.floor(window.innerWidth / 960));
  const [auto, setAuto] = useState(fit);
  const [fixed, setFixed] = useState(0);
  useEffect(() => {
    const on = () => setAuto(fit());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return [fixed || auto, setFixed];
}

export function App() {
  const [zoom, setZoom] = useZoom();
  const [font, setFont] = useState(FONTS[0] ?? '');
  const [value, setValue] = useState(0.6);
  const slices = PIECES.filter((p) => p.slice);
  const buttons = slices.filter((p) => p.name.startsWith('button'));
  const sprites = PIECES.filter((p) => !p.slice);

  return (
    <div
      class="stage"
      style={{ zoom: String(zoom), '--font': font ? `'${font}', ${FALLBACK}` : FALLBACK }}
    >
      <div class="bar">
        <span>UI kit</span>
        <select value={font} onChange={(e) => setFont(e.currentTarget.value)}>
          <option value="">Fallback (no font in src/kit/fonts/)</option>
          {FONTS.map((f) => (
            <option value={f}>{f}</option>
          ))}
        </select>
        {[1, 2, 3, 4].map((z) => (
          <button
            class={z === zoom ? 'kit-button-2' : 'kit-button-quiet'}
            onClick={() => setZoom(z)}
          >
            ×{z}
          </button>
        ))}
        <span class="cap">fill</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onInput={(e) => setValue(Number(e.currentTarget.value))}
        />
      </div>

      <h2>9-slices, every state, native size and stretched</h2>
      {slices.map((p) => (
        <div class="row" key={p.name} style={{ marginBottom: '8px' }}>
          {p.states.map((s) => (
            <div class="cell" key={s}>
              <div
                class={`kit-${p.name}`}
                data-state={s}
                style={{ width: `${p.w}px`, height: `${p.h}px` }}
              />
              <div
                class={`kit-${p.name}`}
                data-state={s}
                style={{ width: `${p.w * 3}px`, height: `${p.h * 2}px` }}
              >
                {p.name.startsWith('button') ? 'Kjøp' : 'Æøå −20 ✓'}
              </div>
              <span class="cap">
                {p.name} {s}
              </span>
            </div>
          ))}
        </div>
      ))}

      <h2>Buttons, live: hover, press, disabled</h2>
      {buttons.map((p) => (
        <div class="row" key={p.name} style={{ marginBottom: '4px' }}>
          <button class={`kit-${p.name}`}>Go</button>
          <button class={`kit-${p.name}`}>Not now</button>
          <button class={`kit-${p.name}`}>Train cooking · 40 kr</button>
          <button class={`kit-${p.name}`} disabled>
            Lv 3
          </button>
          <span class="cap">{p.name}</span>
        </div>
      ))}

      <h2>Activity cards, after the Wildermark bottom bar</h2>
      <div class="row">
        <ActivityCard
          icon="🍳"
          title="Make dinner"
          rate="3.0s · +30 food · lv 2"
          running
          value={value}
        />
        <ActivityCard
          icon="🚿"
          title="Shower"
          rate="2.5s · +40 hygiene · lv 1"
          value={value * 0.5}
        />
        <ActivityCard icon="🛒" title="Groceries" rate="Needs cooking lv 3" locked />
        <div class="kit-card" data-state="dashed" style={{ width: '170px', height: '52px' }}>
          <span class="cap">Free slot</span>
        </div>
      </div>

      <h2>Window</h2>
      <div class="kit-window box" style={{ width: '240px' }}>
        <span>Arvid wants to try something new.</span>
        <span class="cap">Pick one card. The odds show after.</span>
        <div class="row">
          <button class="kit-button-1">Go</button>
          <button class="kit-button-quiet">Not now</button>
        </div>
      </div>

      <h2>Sprites, fill {Math.round(value * 100)}%</h2>
      <div class="row">
        {sprites.map((p) =>
          p.name.startsWith('progress') ? (
            <div class="cell" key={p.name}>
              <KitRing piece={p.name} value={value} segments={24} />
              <span class="cap">{p.name}</span>
            </div>
          ) : (
            p.states.map((s) => (
              <div class="cell" key={p.name + s}>
                <KitBar piece={p.name} state={s} value={value} />
                <span class="cap">
                  {p.name} {s}
                </span>
              </div>
            ))
          ),
        )}
      </div>

      <h2>Font</h2>
      <div class="specimen">
        <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ ÆØÅ</p>
        <p>abcdefghijklmnopqrstuvwxyz æøå</p>
        <p>0123456789 −20 +25% ×1.5 · ✓ ✗ … « » kr</p>
        <p>Arvid lagde middag selv i dag. Det gikk greit, sånn passe.</p>
        <p>A good fit that works in identity or mastery: overskudd +25% for the stay.</p>
      </div>
    </div>
  );
}

function ActivityCard(props: {
  icon: string;
  title: string;
  rate: string;
  value?: number;
  running?: boolean;
  locked?: boolean;
}) {
  const state = props.locked ? 'disabled' : props.running ? 'selected' : 'normal';
  return (
    <div class="kit-card act" data-state={state}>
      <span class="icon">{props.icon}</span>
      <span class="title">{props.title}</span>
      <span class="rate">{props.rate}</span>
      <div class="foot">
        {props.locked ? (
          <span>🔒</span>
        ) : (
          <>
            <KitBar piece="bar-need" state="good" value={props.value ?? 0} />
            <button class={props.running ? 'kit-button-quiet' : 'kit-button-1'}>
              {props.running ? 'Stop' : 'Start'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
