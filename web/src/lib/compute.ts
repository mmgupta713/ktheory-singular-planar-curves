// Promise-based client for the Pyodide worker, plus the shapes api.py returns.
import { useEffect, useState } from "react";
import type { Request, Response } from "../worker/pyodide.worker";

export type Row = {
  m: number;
  excluded: boolean;
  h: number | null;
  ell: number | null;
  s: number | null;
  case: "generic" | "a' | m'" | "b | m'" | null;
};
/** The group K_{2r}: multiplicities of each W_h(k), plus its length. */
export type Group = {
  r: number;
  multiplicities: [number, number][]; // [h, count], h increasing
  total: number;
  expected: number;
};
export type Decomposition = Group & { factors: Row[] };
export type Grid = { M: number; rows: (number | null)[][] };

type Err = { error: string };
export const isErr = (x: unknown): x is Err =>
  typeof x === "object" && x !== null && "error" in x;

const worker = new Worker(new URL("../worker/pyodide.worker.ts", import.meta.url), {
  type: "module",
});
let nextId = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let readyResolve: () => void;
export const ready = new Promise<void>((r) => (readyResolve = r));

worker.onmessage = (e: MessageEvent<Response>) => {
  const msg = e.data;
  if ("ready" in msg) return readyResolve();
  const p = pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  if ("error" in msg) p.reject(new Error(msg.error));
  else p.resolve(msg.result);
};

export function call<T>(fn: string, ...args: number[]): Promise<T | Err> {
  const id = nextId++;
  worker.postMessage({ id, fn, args } satisfies Request);
  return new Promise((resolve, reject) =>
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject }),
  );
}

export function usePyReady(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => void ready.then(() => setOk(true)), []);
  return ok;
}

/** Calls api.<fn>(...args) whenever args change; ignores stale responses. */
export function usePy<T>(fn: string, args: number[] | null) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  });
  const key = args?.join(",");
  useEffect(() => {
    if (!args) return;
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    call<T>(fn, ...args).then(
      (r) => live && setState(isErr(r) ? { error: r.error, loading: false } : { data: r, loading: false }),
      (e: Error) => live && setState({ error: e.message, loading: false }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, key]);
  return state;
}
