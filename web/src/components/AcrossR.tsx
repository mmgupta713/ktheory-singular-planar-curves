// K_{2r} for r = r1..r2: a table (formula + multiplicity of each W_h(k)) and a stacked bar
// chart of the length, split by the contribution h * #W_h(k) of each h.
import { useMemo, useRef, useState } from "react";
import { Group } from "../lib/compute";
import { Params } from "../lib/params";
import { Tooltip, hColors, tickStep, useDark, useWidth } from "./chart";
import { wittProduct } from "./Summary";
import { Tex } from "./Tex";

const H = 300;
const M = { top: 24, right: 16, bottom: 36, left: 48 };

/** #rrggbb -> rgba(r,g,b,alpha) */
function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function AcrossR({
  params: { a, b, p, r, r1, r2 },
  groups,
  onPickR,
}: {
  params: Params;
  groups: Group[];
  onPickR: (r: number) => void;
}) {
  const dark = useDark();
  const maxH = Math.max(1, ...groups.flatMap((g) => g.multiplicities.map(([h]) => h)));
  const colors = useMemo(() => hColors(maxH, dark), [maxH, dark]);
  const hs = Array.from({ length: maxH }, (_, i) => i + 1);
  const count = (g: Group, h: number) => g.multiplicities.find(([hh]) => hh === h)?.[1] ?? 0;
  const maxCount = Math.max(1, ...groups.flatMap((g) => g.multiplicities.map(([, n]) => n)));

  return (
    <div>
      <p className="figure-caption">
        <Tex>{`K_{2r}\\big(k[x,y]/(y^{${a}} - x^{${b}}),\\,(x,y)\\big)`}</Tex> for{" "}
        <Tex>{`${r1} \\le r \\le ${r2}`}</Tex> and <Tex>{`p = ${p}`}</Tex>. Column <Tex>{`W_h`}</Tex> is the
        number of factors <Tex>{`W_h(k)`}</Tex>. Click a row to set <Tex>r</Tex>.
      </p>
      <table className="factors across">
        <thead>
          <tr>
            <th>
              <Tex>r</Tex>
            </th>
            <th className="left">
              <Tex>{`K_{2r} \\cong`}</Tex>
            </th>
            {hs.map((h) => (
              <th key={h}>
                <span className="swatch" style={{ background: colors[h - 1] }} />
                <Tex>{`W_{${h}}`}</Tex>
              </th>
            ))}
            <th>length</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.r} className={g.r === r ? "selected" : undefined} onClick={() => onPickR(g.r)}>
              <td>{g.r}</td>
              <td className="left">
                <Tex>{wittProduct(g.multiplicities)}</Tex>
              </td>
              {hs.map((h) => {
                const n = count(g, h);
                return (
                  <td
                    key={h}
                    style={n ? { background: withAlpha(colors[h - 1], 0.12 + (0.5 * n) / maxCount) } : undefined}
                  >
                    {n || <span className="muted">·</span>}
                  </td>
                );
              })}
              <td title={`(2r+1)(a-1)(b-1)/2 = ${g.expected}`}>
                {g.total}{" "}
                <span className={g.total === g.expected ? "check ok" : "check bad"}>
                  {g.total === g.expected ? "✓" : "✗"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <LengthBars groups={groups} hs={hs} colors={colors} count={count} />
    </div>
  );
}

function LengthBars({
  groups,
  hs,
  colors,
  count,
}: {
  groups: Group[];
  hs: number[];
  colors: string[];
  count: (g: Group, h: number) => number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const [hover, setHover] = useState<number | null>(null);

  const n = groups.length;
  const iw = Math.max(0, width - M.left - M.right);
  const ih = H - M.top - M.bottom;
  const band = iw / n;
  const barW = Math.min(56, band * 0.6);
  const yMax = Math.max(1, ...groups.map((g) => g.total));
  const yStep = tickStep(yMax, 5);
  const yTop = Math.ceil(yMax / yStep) * yStep;
  const y = (v: number) => M.top + ih - (v / yTop) * ih;
  const cx = (i: number) => M.left + (i + 0.5) * band;
  const yTicks = Array.from({ length: yTop / yStep + 1 }, (_, i) => i * yStep);
  const hovered = hover !== null ? groups[hover] : null;

  return (
    <div className="figure" ref={ref} style={{ marginTop: 24 }}>
      <p className="figure-caption">
        Length of <Tex>{`K_{2r}`}</Tex>, i.e. <Tex>{`\\sum_{m'} h = (2r+1)(a-1)(b-1)/2`}</Tex>, split by the
        contribution <Tex>{`h \\cdot \\#W_h(k)`}</Tex> of each <Tex>h</Tex>.
      </p>
      <div className="legend">
        {hs.map((h) => (
          <span key={h}>
            <span className="swatch" style={{ background: colors[h - 1] }} /> <Tex>{`W_{${h}}(k)`}</Tex>
          </span>
        ))}
      </div>
      <div style={{ position: "relative" }}>
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label="Stacked bar chart of the length of K_2r by r">
            {yTicks.map((t) => (
              <g key={t}>
                <line className="grid" x1={M.left} x2={M.left + iw} y1={y(t)} y2={y(t)} />
                <text className="tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                  {t}
                </text>
              </g>
            ))}
            {hovered && <rect className="hover-band" x={cx(hover!) - band / 2} width={band} y={M.top} height={ih} />}
            {groups.map((g, i) => {
              let cum = 0;
              return (
                <g key={g.r}>
                  {hs.map((h) => {
                    const len = h * count(g, h);
                    if (!len) return null;
                    const y0 = y(cum);
                    cum += len;
                    return (
                      <rect
                        key={h}
                        className="seg"
                        x={cx(i) - barW / 2}
                        width={barW}
                        y={y(cum)}
                        height={y0 - y(cum)}
                        fill={colors[h - 1]}
                      />
                    );
                  })}
                  {n <= 16 && (
                    <text className="bar-label" x={cx(i)} y={y(g.total) - 6} textAnchor="middle">
                      {g.total}
                    </text>
                  )}
                  <text className="tick" x={cx(i)} y={M.top + ih + 18} textAnchor="middle">
                    {g.r}
                  </text>
                  <rect
                    x={cx(i) - band / 2}
                    width={band}
                    y={M.top}
                    height={ih}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                </g>
              );
            })}
            <line className="axis" x1={M.left} x2={M.left + iw} y1={y(0)} y2={y(0)} />
            <text className="axis-label" x={M.left + iw} y={H - 2} textAnchor="end">
              r
            </text>
            <text className="axis-label" x={4} y={M.top - 10}>
              length
            </text>
          </svg>
        )}
        {hovered && (
          <Tooltip x={cx(hover!) + barW / 2} y={M.top} width={width}>
            <div className="tt-title">r = {hovered.r}</div>
            {hovered.multiplicities.map(([h, k]) => (
              <div key={h}>
                <span className="swatch" style={{ background: colors[h - 1] }} /> W<sub>{h}</sub>(k)
                {k > 1 && <sup>{k}</sup>}: {h} × {k} = {h * k}
              </div>
            ))}
            <div>
              <strong>length = {hovered.total}</strong>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
