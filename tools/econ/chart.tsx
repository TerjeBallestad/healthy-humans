// A small SVG line and dot chart with a hover crosshair. One y-axis, log or linear.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren, RefObject } from 'preact';

export interface Point {
  x: number;
  y: number;
  /** Drawn as a ring, not a filled dot. */
  hollow?: boolean;
  /** Extra line in the tooltip. */
  note?: string;
}

export interface Series {
  id: string;
  label: string;
  /** A CSS color, usually a var(--series-n). */
  color: string;
  points: Point[];
  line?: boolean;
  dots?: boolean;
}

export interface VLine {
  x: number;
  label: string;
}

interface Props {
  series: Series[];
  height?: number;
  logY?: boolean;
  xDomain?: [number, number];
  yDomain?: [number, number];
  xFormat: (x: number) => string;
  yFormat: (y: number) => string;
  /** Tooltip heading for an x value. Defaults to xFormat. */
  xTitle?: (x: number) => string;
  xTicks?: number[];
  vlines?: VLine[];
  /** Show labels on the vertical lines. */
  vlineLabels?: boolean;
  legend?: boolean;
}

const PAD = { top: 12, right: 16, bottom: 24, left: 52 };

export function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setW(Math.max(200, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceLinearTicks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

function logTicks(lo: number, hi: number): number[] {
  const out: number[] = [];
  const decades = Math.log10(hi / lo);
  const mults = decades > 4 ? [1] : decades > 2 ? [1, 3] : [1, 2, 5];
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
    for (const m of mults) {
      const v = m * 10 ** e;
      if (v >= lo * 0.999 && v <= hi * 1.001) out.push(v);
    }
  }
  return out;
}

export function Chart(props: Props) {
  const { series, height = 220, logY = false, xFormat, yFormat } = props;
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const all = series.flatMap((s) => s.points).filter((p) => !logY || p.y > 0);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const [x0, x1] = props.xDomain ?? [Math.min(...xs, 0), Math.max(...xs, 1)];
  let [y0, y1] = props.yDomain ?? [logY ? Math.min(...ys) : Math.min(0, ...ys), Math.max(...ys)];
  if (!isFinite(y0) || !isFinite(y1)) [y0, y1] = [logY ? 1 : 0, 1];
  if (logY) {
    // Round out to half decades, so the lines never touch the frame.
    y0 = 10 ** (Math.floor(Math.log10(Math.max(y0, 1e-6)) * 2) / 2);
    y1 = Math.max(10 ** (Math.ceil(Math.log10(y1) * 2) / 2), y0 * 10);
  } else {
    y1 = y1 === y0 ? y0 + 1 : y1 + (y1 - y0) * 0.08;
  }

  const iw = width - PAD.left - PAD.right;
  const ih = height - PAD.top - PAD.bottom;
  const sx = (x: number) => PAD.left + ((x - x0) / (x1 - x0 || 1)) * iw;
  const sy = (y: number) =>
    PAD.top +
    ih -
    (logY
      ? ((Math.log10(Math.max(y, y0)) - Math.log10(y0)) / (Math.log10(y1) - Math.log10(y0))) * ih
      : ((y - y0) / (y1 - y0)) * ih);

  const yTicks = logY ? logTicks(y0, y1) : niceLinearTicks(y0, y1);
  const xTicks = props.xTicks ?? niceLinearTicks(x0, x1, Math.max(2, Math.floor(iw / 90)));

  // Labels of close lines go on the next row down.
  const labelRow: number[] = [];
  const rowEnd: number[] = [];
  for (const m of props.vlines ?? []) {
    const x = sx(m.x);
    let row = rowEnd.findIndex((end) => x > end + 4);
    if (row < 0) row = rowEnd.length;
    rowEnd[row] = x + 3 + m.label.length * 5.5;
    labelRow.push(row);
  }

  const onMove = (e: MouseEvent) => {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const x = x0 + ((e.clientX - r.left - PAD.left) / iw) * (x1 - x0);
    setHover(Math.min(x1, Math.max(x0, x)));
  };

  // Each series' point nearest the cursor. Dot-only series show only when close.
  const near =
    hover === null
      ? []
      : series.flatMap((s) => {
          const pts = s.points.filter((p) => !logY || p.y > 0);
          if (!pts.length) return [];
          const p = pts.reduce((a, b) => (Math.abs(b.x - hover) < Math.abs(a.x - hover) ? b : a));
          if (!s.line && Math.abs(sx(p.x) - sx(hover)) > 12) return [];
          return [{ s, p }];
        });
  const tipX = near[0] ? near[0].p.x : hover;

  return (
    <div class="chart" ref={ref}>
      {props.legend !== false && series.length > 1 && (
        <div class="legend">
          {series.map((s) => (
            <span key={s.id}>
              <i style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <svg
        width={width}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
      >
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line class="grid" x1={PAD.left} x2={PAD.left + iw} y1={sy(t)} y2={sy(t)} />
            <text class="tick" x={PAD.left - 6} y={sy(t)} dy="0.32em" text-anchor="end">
              {yFormat(t)}
            </text>
          </g>
        ))}
        <line class="axis" x1={PAD.left} x2={PAD.left + iw} y1={PAD.top + ih} y2={PAD.top + ih} />
        {xTicks.map((t) => (
          <text key={`x${t}`} class="tick" x={sx(t)} y={height - 6} text-anchor="middle">
            {xFormat(t)}
          </text>
        ))}
        {props.vlines?.map((m, i) => (
          <g key={`v${m.label}`}>
            <line class="vline" x1={sx(m.x)} x2={sx(m.x)} y1={PAD.top} y2={PAD.top + ih} />
            {props.vlineLabels && (
              <text class="vlabel" x={sx(m.x) + 3} y={PAD.top + 9 + labelRow[i]! * 12}>
                {m.label}
              </text>
            )}
          </g>
        ))}
        {series.map((s) => {
          const pts = s.points.filter((p) => !logY || p.y > 0);
          return (
            <g key={s.id}>
              {s.line !== false && pts.length > 1 && (
                <polyline
                  class="series"
                  stroke={s.color}
                  points={pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
                />
              )}
              {s.dots &&
                pts.map((p, i) => (
                  <circle
                    key={i}
                    class="dot"
                    cx={sx(p.x)}
                    cy={sy(p.y)}
                    r={4}
                    fill={p.hollow ? 'var(--surface-1)' : s.color}
                    stroke={p.hollow ? s.color : 'var(--surface-1)'}
                    stroke-width={2}
                  />
                ))}
            </g>
          );
        })}
        {tipX !== null && (
          <line class="cross" x1={sx(tipX)} x2={sx(tipX)} y1={PAD.top} y2={PAD.top + ih} />
        )}
      </svg>
      {tipX !== null && near.length > 0 && (
        <Tooltip left={sx(tipX)} width={width}>
          <b>{(props.xTitle ?? xFormat)(tipX)}</b>
          {near.map(({ s, p }) => (
            <div key={s.id} class="tip-row">
              <i style={{ background: s.color }} />
              <span>{s.label}</span>
              <span class="num">{yFormat(p.y)}</span>
              {p.note && <span class="tip-note">{p.note}</span>}
            </div>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

function Tooltip(props: { left: number; width: number; children: ComponentChildren }) {
  const right = props.left > props.width * 0.6;
  return (
    <div
      class="tooltip"
      style={
        right ? { right: `${props.width - props.left + 10}px` } : { left: `${props.left + 10}px` }
      }
    >
      {props.children}
    </div>
  );
}

/** "1.2k", "34k", "1.2M". */
export function kr(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e6) return `${+(v / 1e6).toPrecision(2)}M`;
  if (a >= 1e3) return `${+(v / 1e3).toPrecision(2)}k`;
  return `${+v.toPrecision(3)}`;
}
