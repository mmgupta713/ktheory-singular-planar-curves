// Heatmap of h(a,b,r,p,m') over r = 0..R (rows) and m' (columns), drawn on a canvas.
import { useEffect, useMemo, useRef, useState } from "react";
import { Grid } from "../lib/compute";
import { Params } from "../lib/params";
import { Tooltip, chrome, hColors, tickStep, useDark, useWidth } from "./chart";
import { Tex } from "./Tex";

const M = { top: 8, right: 16, bottom: 36, left: 40 };
const ROW_H = 28;

export function Heatmap({
  params: { a, b, p, r, R },
  grid,
  onPickR,
}: {
  params: Params;
  grid: Grid;
  onPickR: (r: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = useWidth(ref);
  const dark = useDark();
  const [hover, setHover] = useState<{ r: number; m: number } | null>(null);

  const rows = grid.rows;
  const nR = rows.length;
  const iw = Math.max(0, width - M.left - M.right);
  const ih = nR * ROW_H;
  const height = M.top + ih + M.bottom;
  const cw = iw / grid.M;
  const maxH = rows.reduce((mx, row) => row.reduce<number>((m2, h) => Math.max(m2, h ?? 0), mx), 1);
  const colors = useMemo(() => hColors(maxH, dark), [maxH, dark]);
  const c = chrome(dark);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !width) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(iw * dpr);
    cv.height = Math.round(ih * dpr);
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);
    // a 1px surface gap between rows (and columns, when they are wide enough)
    const gx = cw >= 6 ? 1 : 0;
    rows.forEach((row, ri) => {
      row.forEach((h, mi) => {
        const x0 = mi * cw;
        ctx.fillStyle = h == null ? c.excluded : h === 0 ? c.zero : colors[h - 1];
        // without a gap, overdraw by half a pixel so sub-pixel columns leave no seams
        ctx.fillRect(x0, ri * ROW_H, gx ? cw - gx : cw + 0.5, ROW_H - 1);
        if (h == null && cw >= 4) {
          ctx.strokeStyle = c.hatch;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0, ri * ROW_H + ROW_H - 1);
          ctx.lineTo(x0 + cw - gx, ri * ROW_H);
          ctx.stroke();
        }
      });
    });
    // ring around the currently selected r
    if (r <= R) {
      ctx.strokeStyle = c.ring;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, r * ROW_H + 1, iw - 2, ROW_H - 3);
    }
  }, [rows, width, iw, ih, cw, colors, c, r, R]);

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const mi = Math.floor((e.clientX - box.left) / cw);
    const ri = Math.floor((e.clientY - box.top) / ROW_H);
    setHover(mi >= 0 && mi < grid.M && ri >= 0 && ri < nR ? { r: ri, m: mi + 1 } : null);
  }

  const xStep = tickStep(grid.M, Math.max(2, iw / 60));
  const xTicks = Array.from({ length: Math.floor(grid.M / xStep) }, (_, i) => (i + 1) * xStep);
  const hv = hover && rows[hover.r][hover.m - 1];

  return (
    <div className="figure" ref={ref}>
      <p className="figure-caption">
        <Tex>{`h(${a},${b},r,${p},m')`}</Tex> for <Tex>{`0 \\le r \\le ${R}`}</Tex> and{" "}
        <Tex>{`1 \\le m' \\le ${grid.M}`}</Tex>. Hatched columns are <Tex>{`p \\mid m'`}</Tex>. Click a row to set{" "}
        <Tex>r</Tex>.
      </p>
      <div className="legend">
        <span className="swatch" style={{ background: c.zero }} /> 0
        {colors.map((col, i) => (
          <span key={i}>
            <span className="swatch" style={{ background: col }} /> {i + 1}
          </span>
        ))}
        <span>
          <span className="swatch" style={{ background: c.excluded }} /> p | m′
        </span>
      </div>
      {width > 0 && (
        <div className="heat-wrap" style={{ height }}>
          <svg width={width} height={height} className="heat-axes" aria-hidden>
            {rows.map((_, ri) => (
              <text
                key={ri}
                className={ri === r ? "tick strong" : "tick"}
                x={M.left - 8}
                y={M.top + ri * ROW_H + ROW_H / 2}
                dy="0.32em"
                textAnchor="end"
              >
                {ri}
              </text>
            ))}
            {xTicks.map((t) => (
              <text key={t} className="tick" x={M.left + (t - 0.5) * cw} y={M.top + ih + 18} textAnchor="middle">
                {t}
              </text>
            ))}
            <text className="axis-label" x={M.left + iw} y={height - 2} textAnchor="end">
              m′
            </text>
            <text className="axis-label" x={4} y={M.top + 10}>
              r
            </text>
          </svg>
          <canvas
            ref={canvas}
            role="img"
            aria-label="Heatmap of h over r and m'"
            style={{ position: "absolute", left: M.left, top: M.top, width: iw, height: ih, cursor: "pointer" }}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            onClick={() => hover && onPickR(hover.r)}
          />
          {hover && (
            <Tooltip x={M.left + (hover.m - 0.5) * cw} y={M.top + (hover.r + 1) * ROW_H} width={width}>
              <div className="tt-title">
                r = {hover.r}, m′ = {hover.m}
              </div>
              {hv == null ? <div className="muted">p | m′ — not an index</div> : <strong>h = {hv}</strong>}
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
