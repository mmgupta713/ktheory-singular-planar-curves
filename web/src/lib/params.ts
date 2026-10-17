// Parameter state, validation (mirrors cusp_h._check_args), and URL query sync.
import { useEffect, useReducer, useState } from "react";

// r: the single degree shown in the Decomposition and h-vs-m' tabs;
// r1..r2: the range shown in the Across-r and heatmap tabs.
export type Params = { a: number; b: number; r: number; p: number; r1: number; r2: number };

export const LIMITS: Record<keyof Params, [number, number]> = {
  a: [2, 15],
  b: [2, 15],
  r: [0, 10],
  p: [2, 31],
  r1: [0, 10],
  r2: [0, 10],
};
const DEFAULTS: Params = { a: 2, b: 3, r: 2, p: 2, r1: 0, r2: 6 };

export const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
export const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

const NAMES: Record<keyof Params, string> = { a: "a", b: "b", r: "r", p: "p", r1: "r₁", r2: "r₂" };

export function validate(params: Params): string | null {
  const { a, b, p, r1, r2 } = params;
  for (const k of Object.keys(LIMITS) as (keyof Params)[]) {
    const [lo, hi] = LIMITS[k];
    const v = params[k];
    if (!Number.isInteger(v) || v < lo || v > hi) return `${NAMES[k]} must be an integer in [${lo}, ${hi}]`;
  }
  if (gcd(a, b) !== 1) return `a and b must be relatively prime (gcd(${a}, ${b}) = ${gcd(a, b)})`;
  if (!isPrime(p)) return `p = ${p} is not prime`;
  if (r1 > r2) return `need r₁ ≤ r₂ (got r₁ = ${r1}, r₂ = ${r2})`;
  return null;
}

function fromQuery(): Params {
  const q = new URLSearchParams(window.location.search);
  if (!q.has("r2") && q.has("R")) q.set("r2", q.get("R")!); // links from before r1/r2 replaced R
  const out = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS) as (keyof Params)[]) {
    const v = q.get(k);
    if (v !== null && v !== "" && Number.isFinite(Number(v))) out[k] = Number(v);
  }
  return out;
}

export function useParams() {
  const [params, set] = useReducer(
    (s: Params, patch: Partial<Params>) => ({ ...s, ...patch }),
    undefined,
    fromQuery,
  );
  useEffect(() => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    window.history.replaceState(null, "", `?${q}`);
  }, [params]);
  return [params, set] as const;
}

export function useDebounced<T>(value: T, ms = 150): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
