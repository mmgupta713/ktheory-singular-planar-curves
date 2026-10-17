// Lollipop plot of h(a,b,r,p,m') against m'.
import { useRef, useState } from "react";
import { Row } from "../lib/compute";
import { Params } from "../lib/params";
import { Tooltip, tickStep, useWidth } from "./chart";
import { Tex } from "./Tex";

const H = 280;
const M = { top: 16, right: 16, bottom: 36, left: 40 };

export function HPlot({ params: { a, b, r }, rows }: { params: Params; rows: Row[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const [hover, setHover] = useState<number | null>(null);

  const N = rows.length;
  const maxH = Math.max(1, ...rows.map((d) => d.h ?? 0));
  const iw = Math.max(0, width - M.left - M.right);
  const ih = H - M.top - M.bottom;
  const bw = iw / N;
  const x = (m: number) => M.left + (m - 0.5) * bw;
  const y = (h: number) => M.top + ih - (h / maxH) * ih;
  const xStep = tickStep(N, Math.max(2, iw / 60));
  const xTicks = Array.from({ length: Math.floor(N / xStep) }, (_, i) => (i + 1) * xStep);
  const yTicks = Array.from({ length: maxH + 1 }, (_, i) => i);
  const stem = Math.max(1, Math.min(2, bw * 0.5));
  const dot = Math.max(2, Math.min(4, bw * 0.4));
  const hovered = hover !== null ? rows[hover] : null;

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = Math.floor(px / bw);
    setHover(i >= 0 && i < N ? i : null);
  }

  return (
    <div className="figure" ref={ref}>
      <p className="figure-caption">
        <Tex>{`h(${a},${b},${r},p,m')`}</Tex> for <Tex>{`1 \\le m' \\le (r+2)ab = ${N}`}</Tex>. Filled
        dots are nonzero factors; hollow dots have <Tex>h = 0</Tex>; gaps are <Tex>{`p \\mid m'`}</Tex>.
      </p>
      <div style={{ position: "relative" }}>
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label="Lollipop plot of h against m'">
            {yTicks.map((t) => (
              <g key={t}>
                <line className="grid" x1={M.left} x2={M.left + iw} y1={y(t)} y2={y(t)} />
                <text className="tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                  {t}
                </text>
              </g>
            ))}
            <line className="axis" x1={M.left} x2={M.left + iw} y1={y(0)} y2={y(0)} />
            {xTicks.map((t) => (
              <text key={t} className="tick" x={x(t)} y={M.top + ih + 18} textAnchor="middle">
                {t}
              </text>
            ))}
            <text className="axis-label" x={M.left + iw} y={H - 2} textAnchor="end">
              m′
            </text>
            <text className="axis-label" x={4} y={M.top - 4}>
              h
            </text>

            {hovered && <rect className="hover-band" x={x(hovered.m) - bw / 2} width={bw} y={M.top} height={ih} />}

            {rows.map((d) =>
              d.excluded || d.h == null ? null : d.h > 0 ? (
                <g key={d.m}>
                  <line className="stem" x1={x(d.m)} x2={x(d.m)} y1={y(0)} y2={y(d.h)} strokeWidth={stem} />
                  <circle className="dot" cx={x(d.m)} cy={y(d.h)} r={dot} />
                </g>
              ) : (
                <circle key={d.m} className="dot-zero" cx={x(d.m)} cy={y(0)} r={Math.max(1.5, dot * 0.6)} />
              ),
            )}

            <rect
              x={M.left}
              y={M.top}
              width={iw}
              height={ih}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            />
          </svg>
        )}
        {hovered && (
          <Tooltip x={x(hovered.m)} y={M.top} width={width}>
            <div className="tt-title">m′ = {hovered.m}</div>
            {hovered.excluded ? (
              <div className="muted">p | m′ — not an index</div>
            ) : (
              <>
                <div>ℓ(a,b,m′) = {hovered.ell}</div>
                <div>s = {hovered.s}</div>
                <div>case: {hovered.case}</div>
                <div>
                  <strong>h = {hovered.h}</strong>
                </div>
              </>
            )}
          </Tooltip>
        )}
      </div>
    </div>
  );
}
