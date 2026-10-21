import { useMemo, useState } from 'preact/hooks';
import { Chart, kr, useWidth, type Series } from './chart';
import { itemCurve, minutes, run, type Trace } from './model';
import {
  changes,
  defaultParams,
  MODELLED_LINES,
  type ItemId,
  type LineId,
  type Params,
  type TierId,
} from './params';

const LABEL: Record<ItemId, string> = {
  nudge: 'Nudge',
  omsorgRate: 'Omsorg rate',
  omsorgCap: 'Omsorg cap',
  insight: 'Insight',
  staff: 'Staff speed',
  payGrade: 'Pay grade',
  grant: 'Grant',
  house: 'House',
  bed: 'Beds',
  hire: 'Hires',
};

/** View 1 panels follow the shop tabs. Hires sit with staff, beds with funding. */
const PANELS: { title: string; items: ItemId[] }[] = [
  { title: 'You', items: ['nudge', 'omsorgRate', 'omsorgCap'] },
  { title: 'Staff', items: ['hire', 'staff', 'payGrade'] },
  { title: 'Funding', items: ['grant', 'bed'] },
  { title: 'House', items: ['house'] },
];

const SLOT = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];
const WEEKS_PER_YEAR = 48;
const STORE = 'hh-econ-params';

function load(): Params {
  const d = defaultParams();
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return d;
    const saved = JSON.parse(raw) as Partial<Params>;
    return {
      ...d,
      ...saved,
      lines: Object.fromEntries(
        Object.entries(d.lines).map(([id, l]) => [id, { ...l, ...saved.lines?.[id as LineId] }]),
      ) as Params['lines'],
      tax: { ...d.tax, ...saved.tax },
      tierWeeks: { ...d.tierWeeks, ...saved.tierWeeks },
    };
  } catch {
    return d;
  }
}

function save(p: Params) {
  try {
    localStorage.setItem(STORE, JSON.stringify(p));
  } catch {
    // Private windows may block storage. The tool still works.
  }
}

export function App() {
  const [p, setP] = useState(load);
  const update = (f: (q: Params) => void) => {
    const q = structuredClone(p);
    f(q);
    save(q);
    setP(q);
  };
  const trace = useMemo(() => run(p), [p]);

  return (
    <div class="layout">
      <Controls
        p={p}
        update={update}
        reset={() => (save(defaultParams()), setP(defaultParams()))}
      />
      <main>
        <header>
          <h1>Healthy Humans economy</h1>
        </header>
        <section>
          <h2>1 · Cost curves</h2>
          <p class="lede">
            Price of each step, and price per unit of what the step gives, compared with step 1.
            Rings are steps past the written names.
          </p>
          <CostCurves p={p} />
        </section>
        <section>
          <h2>2 · Time to afford</h2>
          <p class="lede">
            The buyer{' '}
            {p.rule === 'payback' ? 'saves for the best payback' : 'buys the cheapest item'}.
            Residents are discharged at “{TIER_LABEL[p.target]}”.
          </p>
          <Timeline p={p} trace={trace} />
        </section>
      </main>
    </div>
  );
}

const TIER_LABEL: Record<TierId, string> = {
  alone: 'Fit to live alone',
  work: 'Fit for work',
  healthy: 'Healthy human',
};

// ---------- View 1 ----------

function CostCurves({ p }: { p: Params }) {
  const curves = PANELS.map((panel) => ({
    ...panel,
    curves: panel.items.map((id) => itemCurve(p, id)),
  }));
  const prices = curves.flatMap((c) => c.curves.flatMap((x) => x.steps.map((s) => s.price)));
  const per = curves.flatMap((c) => c.curves.flatMap((x) => x.steps.map((s) => s.perGain)));
  const priceDomain: [number, number] = [Math.min(...prices), Math.max(...prices)];
  const perDomain: [number, number] = [Math.min(...per, 1), Math.max(...per)];
  const xDomain: [number, number] = [0.5, p.steps + 0.5];
  const xTicks = Array.from({ length: p.steps }, (_, i) => i + 1).filter(
    (n) => p.steps <= 12 || n % 2 === 1,
  );

  const series = (items: ReturnType<typeof itemCurve>[], y: 'price' | 'perGain'): Series[] =>
    items.map((c, i) => ({
      id: c.id,
      label: LABEL[c.id],
      color: SLOT[i]!,
      dots: true,
      points: c.steps.map((s) => ({
        x: s.n,
        y: s[y],
        hollow: s.unnamed,
        note:
          y === 'price'
            ? s.payback !== undefined
              ? `pays back in ${s.payback.toFixed(0)} wk`
              : undefined
            : `price ${kr(s.price)} kr`,
      })),
    }));

  return (
    <div class="panels">
      {curves.map((c) => (
        <div class="panel" key={c.title}>
          <h3>{c.title}</h3>
          <div class="sub">Price, kr</div>
          <Chart
            series={series(c.curves, 'price')}
            logY
            height={170}
            xDomain={xDomain}
            yDomain={priceDomain}
            xTicks={xTicks}
            xFormat={(x) => `${x}`}
            xTitle={(x) => `Step ${x}`}
            yFormat={kr}
          />
          <div class="sub">Price per gain, × step 1</div>
          <Chart
            series={series(c.curves, 'perGain')}
            logY
            height={150}
            legend={false}
            xDomain={xDomain}
            yDomain={perDomain}
            xTicks={xTicks}
            xFormat={(x) => `${x}`}
            xTitle={(x) => `Step ${x}`}
            yFormat={(y) => `${+y.toPrecision(2)}×`}
          />
        </div>
      ))}
    </div>
  );
}

// ---------- View 2 ----------

function date(w: number) {
  const week = Math.floor(w);
  return `Y${Math.floor(week / WEEKS_PER_YEAR) + 1} M${(Math.floor(week / 4) % 12) + 1}`;
}

function Timeline({ p, trace }: { p: Params; trace: Trace }) {
  const xDomain: [number, number] = [0, p.weeks];
  // Ticks in real minutes, placed on the week axis.
  const step = [5, 10, 15, 20, 30, 60].find((m) => minutes(p, p.weeks) / m <= 8) ?? 120;
  const xTicks: number[] = [];
  for (let m = 0; m <= minutes(p, p.weeks); m += step) xTicks.push((m * 60) / p.secondsPerWeek);
  const xFormat = (w: number) => `${Math.round(minutes(p, w))}m`;
  const xTitle = (w: number) =>
    `Week ${Math.floor(w) + 1} · ${date(w)} · ${minutes(p, w).toFixed(0)} min`;
  const vlines = trace.markers.map((m) => ({ x: m.week, label: m.label }));
  const common = { xDomain, xTicks, xFormat, xTitle, vlines };

  const s = trace.samples;
  const income: Series[] = [
    { id: 'net', label: 'Net', color: SLOT[0]!, points: s.map((x) => ({ x: x.week, y: x.net })) },
    {
      id: 'grant',
      label: 'Grant',
      color: SLOT[1]!,
      points: s.map((x) => ({ x: x.week, y: x.grant })),
    },
    { id: 'tax', label: 'Tax', color: SLOT[2]!, points: s.map((x) => ({ x: x.week, y: x.tax })) },
    {
      id: 'wages',
      label: 'Wages',
      color: SLOT[3]!,
      points: s.map((x) => ({ x: x.week, y: x.wages })),
    },
  ];
  const gaps: Series[] = [
    {
      id: 'gap',
      label: 'Weeks since the last purchase',
      color: SLOT[0]!,
      dots: true,
      points: trace.purchases.map((x) => ({
        x: x.week,
        y: Math.max(x.gap, 0.05),
        hollow: x.unnamed,
        note: `${LABEL[x.id]} ${x.n} · ${kr(x.price)} kr`,
      })),
    },
  ];
  const longest = trace.purchases.reduce<Trace['purchases'][number] | undefined>(
    (a, b) => (!a || b.gap > a.gap ? b : a),
    undefined,
  );

  return (
    <>
      <Kpis p={p} trace={trace} longest={longest} />
      <div class="sub">Kroner per week</div>
      <Chart series={income} logY height={220} yFormat={kr} vlineLabels {...common} />
      <div class="sub">Weeks between purchases</div>
      <Chart
        series={gaps}
        logY
        height={180}
        yFormat={(y) => `${+y.toPrecision(2)}`}
        legend={false}
        {...common}
      />
      <div class="sub">Purchases and discharges</div>
      <Rug p={p} trace={trace} xTicks={xTicks} xFormat={xFormat} />
    </>
  );
}

function Kpis({
  p,
  trace,
  longest,
}: {
  p: Params;
  trace: Trace;
  longest?: Trace['purchases'][number];
}) {
  const at = (label: string) => trace.markers.find((m) => m.label === label)?.week;
  const tiles: [string, number | undefined, string?][] = [
    ['First hire', at('First hire')],
    ['First discharge', at('First discharge')],
    ['Staff full', at('Staff full')],
    ['Beds full', at('Beds full')],
    ['Named steps done', at('Named steps done')],
  ];
  const last = trace.samples.at(-1);
  return (
    <div class="kpis">
      {tiles.map(([label, w]) => (
        <div class="kpi" key={label}>
          <div class="kpi-label">{label}</div>
          <div class="kpi-value">{w === undefined ? '–' : `${minutes(p, w).toFixed(0)} min`}</div>
          <div class="kpi-sub">{w === undefined ? 'not reached' : `week ${Math.floor(w) + 1}`}</div>
        </div>
      ))}
      {longest && (
        <div class="kpi">
          <div class="kpi-label">Longest wait</div>
          <div class="kpi-value">{minutes(p, longest.gap).toFixed(0)} min</div>
          <div class="kpi-sub">
            for {LABEL[longest.id]} {longest.n}
          </div>
        </div>
      )}
      {last && (
        <div class="kpi">
          <div class="kpi-label">Discharges</div>
          <div class="kpi-value">{trace.discharges.length}</div>
          <div class="kpi-sub">{kr(last.net)} kr/week at the end</div>
        </div>
      )}
    </div>
  );
}

/** One row per item. A dot for each purchase, a tick for each discharge. */
function Rug(props: { p: Params; trace: Trace; xTicks: number[]; xFormat: (x: number) => string }) {
  const { p, trace } = props;
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const rows: (ItemId | 'discharge')[] = ['hire', 'bed', ...MODELLED_LINES, 'discharge'];
  const ROW = 22;
  const left = 96;
  const right = 16;
  const height = rows.length * ROW + 24;
  const sx = (w: number) => left + (w / p.weeks) * (width - left - right);
  return (
    <div class="chart" ref={ref}>
      <svg width={width} height={height} onMouseLeave={() => setTip(null)}>
        {rows.map((r, i) => (
          <g key={r}>
            <line
              class="grid"
              x1={left}
              x2={width - right}
              y1={i * ROW + ROW / 2}
              y2={i * ROW + ROW / 2}
            />
            <text class="tick" x={left - 8} y={i * ROW + ROW / 2} dy="0.32em" text-anchor="end">
              {r === 'discharge' ? 'Discharges' : LABEL[r]}
            </text>
          </g>
        ))}
        {trace.markers.map((m) => (
          <line
            key={m.label}
            class="vline"
            x1={sx(m.week)}
            x2={sx(m.week)}
            y1={0}
            y2={rows.length * ROW}
          />
        ))}
        {trace.purchases.map((x, i) => {
          const y = rows.indexOf(x.id) * ROW + ROW / 2;
          return (
            <circle
              key={i}
              class="dot"
              cx={sx(x.week)}
              cy={y}
              r={4}
              fill={x.unnamed ? 'var(--surface-1)' : 'var(--text-secondary)'}
              stroke={x.unnamed ? 'var(--text-secondary)' : 'var(--surface-1)'}
              stroke-width={2}
              onMouseEnter={() =>
                setTip({
                  x: sx(x.week),
                  y,
                  text: `${LABEL[x.id]} ${x.n} · ${kr(x.price)} kr · ${minutes(p, x.week).toFixed(0)} min`,
                })
              }
            />
          );
        })}
        {trace.discharges.map((d, i) => {
          const y = (rows.length - 1) * ROW + ROW / 2;
          return (
            <line key={i} class="tickmark" x1={sx(d.week)} x2={sx(d.week)} y1={y - 6} y2={y + 6} />
          );
        })}
        {props.xTicks.map((t) => (
          <text key={t} class="tick" x={sx(t)} y={height - 6} text-anchor="middle">
            {props.xFormat(t)}
          </text>
        ))}
      </svg>
      {tip && (
        <div class="tooltip" style={{ left: `${tip.x + 10}px`, top: `${tip.y - 10}px` }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}

// ---------- Controls ----------

interface FieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  set: (v: number) => void;
}

function Field({ label, value, min, max, step, set }: FieldProps) {
  const parse = (e: Event) => {
    const v = Number((e.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(v)) set(v);
  };
  return (
    <label class="field">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onInput={parse} />
      <input type="number" min={min} step={step} value={value} onChange={parse} />
    </label>
  );
}

function Controls(props: {
  p: Params;
  update: (f: (q: Params) => void) => void;
  reset: () => void;
}) {
  const { p, update } = props;
  const [copied, setCopied] = useState<string[] | null>(null);
  const copy = () => {
    const lines = changes(p);
    setCopied(lines);
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
  };
  const F = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    set: (q: Params, v: number) => void,
  ) => (
    <Field
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      set={(v) => update((q) => set(q, v))}
    />
  );

  return (
    <aside class="controls">
      <div class="buttons">
        <button onClick={copy}>Copy changes</button>
        <button onClick={props.reset}>Reset</button>
      </div>
      {copied && (
        <pre class="changes">{copied.length ? copied.join('\n') : 'Same as the game.'}</pre>
      )}

      <details open>
        <summary>Upgrade lines</summary>
        {F('Cost growth per step', p.costGrowth, 1.1, 4, 0.05, (q, v) => (q.costGrowth = v))}
        {(Object.keys(p.lines) as LineId[]).map((id) => {
          const l = p.lines[id];
          return (
            <div class="group" key={id}>
              <div class="group-title">{LABEL[id]}</div>
              {F('Base cost', l.baseCost, 50, 5000, 50, (q, v) => (q.lines[id].baseCost = v))}
              {l.times !== undefined
                ? F('× per step', l.times, 1.05, 3, 0.05, (q, v) => (q.lines[id].times = v))
                : F('+ per step', l.plus ?? 0, 1, 100, 1, (q, v) => (q.lines[id].plus = v))}
            </div>
          );
        })}
      </details>

      <details open>
        <summary>Beds, staff, income</summary>
        {F('Bed base cost', p.bedBase, 100, 5000, 50, (q, v) => (q.bedBase = v))}
        {F('Bed cost growth', p.bedGrowth, 1, 3, 0.05, (q, v) => (q.bedGrowth = v))}
        {F('Max beds', p.maxBeds, 1, 10, 1, (q, v) => (q.maxBeds = v))}
        {F('Job ad base cost', p.hireBase, 50, 3000, 50, (q, v) => (q.hireBase = v))}
        {F('Job ad growth', p.hireGrowth, 1, 3, 0.05, (q, v) => (q.hireGrowth = v))}
        {F('Staff slots', p.maxStaff, 0, 10, 1, (q, v) => (q.maxStaff = v))}
        {F('Wage, kr/week', p.workerWage, 0, 200, 5, (q, v) => (q.workerWage = v))}
        {F('Grant, kr/week', p.grant, 0, 500, 10, (q, v) => (q.grant = v))}
        {F('Grant per extra bed', p.grantPerBed, 0, 200, 5, (q, v) => (q.grantPerBed = v))}
        {F('Tax, fit to live alone', p.tax.alone, 0, 500, 5, (q, v) => (q.tax.alone = v))}
        {F('Tax, fit for work', p.tax.work, 0, 500, 5, (q, v) => (q.tax.work = v))}
        {F('Tax, healthy human', p.tax.healthy, 0, 1000, 10, (q, v) => (q.tax.healthy = v))}
        {F(
          'Omsorg per second',
          p.omsorgPerSecond,
          0.25,
          5,
          0.05,
          (q, v) => (q.omsorgPerSecond = v),
        )}
        {F(
          'Omsorg cap',
          p.lines.omsorgCap.start,
          10,
          200,
          5,
          (q, v) => (q.lines.omsorgCap.start = v),
        )}
        {F('Pace', p.pace, 0.1, 2, 0.05, (q, v) => (q.pace = v))}
        {F(
          'Staff nudges per second',
          p.staffNudgesPerSecond,
          0.05,
          2,
          0.05,
          (q, v) => (q.staffNudgesPerSecond = v),
        )}
      </details>

      <details open>
        <summary>Model</summary>
        <label class="field select">
          <span>Buyer</span>
          <select
            value={p.rule}
            onChange={(e) =>
              update(
                (q) => (q.rule = (e.currentTarget as HTMLSelectElement).value as Params['rule']),
              )
            }
          >
            <option value="payback">Best payback</option>
            <option value="cheapest">Cheapest first</option>
          </select>
        </label>
        <label class="field select">
          <span>Discharge at</span>
          <select
            value={p.target}
            onChange={(e) =>
              update((q) => (q.target = (e.currentTarget as HTMLSelectElement).value as TierId))
            }
          >
            {(Object.keys(TIER_LABEL) as TierId[]).map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        {F(
          'Weeks to fit to live alone',
          p.tierWeeks.alone,
          1,
          100,
          1,
          (q, v) => (q.tierWeeks.alone = v),
        )}
        {F('Weeks to fit for work', p.tierWeeks.work, 1, 150, 1, (q, v) => (q.tierWeeks.work = v))}
        {F(
          'Weeks to healthy human',
          p.tierWeeks.healthy,
          1,
          200,
          1,
          (q, v) => (q.tierWeeks.healthy = v),
        )}
        {F('Empty bed, weeks', p.admitGap, 0, 10, 0.5, (q, v) => (q.admitGap = v))}
        {F('Speed follows nudges ^', p.nudgeExp, 0, 1.5, 0.05, (q, v) => (q.nudgeExp = v))}
        {F('Speed follows house ^', p.overskuddExp, 0, 1.5, 0.05, (q, v) => (q.overskuddExp = v))}
        {F('Max ladder speed ×', p.maxSpeed, 1, 50, 0.5, (q, v) => (q.maxSpeed = v))}
        {F(
          'Player taps per second',
          p.tapsPerSecond,
          0.1,
          3,
          0.05,
          (q, v) => (q.tapsPerSecond = v),
        )}
        {F('Share of time away', p.awayShare, 0, 0.95, 0.05, (q, v) => (q.awayShare = v))}
        {F('One absence, seconds', p.awayStretch, 5, 600, 5, (q, v) => (q.awayStretch = v))}
        {F('Tax horizon, weeks', p.taxHorizon, 0, 200, 4, (q, v) => (q.taxHorizon = v))}
        {F('Run length, weeks', p.weeks, 24, 960, 24, (q, v) => (q.weeks = v))}
        {F('Steps in view 1', p.steps, 3, 25, 1, (q, v) => (q.steps = v))}
      </details>
    </aside>
  );
}
