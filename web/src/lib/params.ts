// Parameter state, validation (mirrors cusp_h._check_args), and URL query sync.
import { useEffect, useReducer, useState } from "react";

export type Params = { a: number; b: number; r: number; p: number; R: number };

export const LIMITS: Record<keyof Params, [number, number]> = {
  a: [2, 15],
  b: [2, 15],
  r: [0, 10],
  p: [2, 31],
  R: [0, 10],
};
const DEFAULTS: Params = { a: 2, b: 3, r: 2, p: 2, R: 6 };

export const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
export const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

export function validate({ a, b, r, p, R }: Params): string | null {
  for (const [k, v] of Object.entries({ a, b, r, p, R }) as [keyof Params, number][]) {
    const [lo, hi] = LIMITS[k];
    if (!Number.isInteger(v) || v < lo || v > hi) return `${k} must be an integer in [${lo}, ${hi}]`;
  }
  if (gcd(a, b) !== 1) return `a and b must be relatively prime (gcd(${a}, ${b}) = ${gcd(a, b)})`;
  if (!isPrime(p)) return `p = ${p} is not prime`;
  return null;
}

function fromQuery(): Params {
  const q = new URLSearchParams(window.location.search);
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
