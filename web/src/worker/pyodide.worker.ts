/// <reference lib="webworker" />
// Runs cusp_h.py (unmodified, from the repo root) inside Pyodide, off the main thread.
import type { PyodideInterface } from "pyodide";
import cuspSrc from "../../../cusp_h.py?raw";
import apiSrc from "../py/api.py?raw";

const PYODIDE_VERSION = "0.26.4"; // keep in sync with package.json
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export type Request = { id: number; fn: string; args: number[] };
export type Response =
  | { id: number; result: unknown }
  | { id: number; error: string }
  | { id: -1; ready: true };

async function init(): Promise<PyodideInterface> {
  const { loadPyodide } = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`);
  const py: PyodideInterface = await loadPyodide({ indexURL: INDEX_URL });
  py.FS.writeFile("/home/pyodide/cusp_h.py", cuspSrc);
  py.FS.writeFile("/home/pyodide/api.py", apiSrc);
  py.runPython("import api");
  return py;
}

const pyReady = init();
pyReady.then(() => postMessage({ id: -1, ready: true } satisfies Response));

onmessage = async (e: MessageEvent<Request>) => {
  const { id, fn, args } = e.data;
  try {
    const py = await pyReady;
    const f = py.pyimport("api")[fn];
    const out = f(...args);
    const result = out?.toJs ? out.toJs({ dict_converter: Object.fromEntries }) : out;
    out?.destroy?.();
    postMessage({ id, result } satisfies Response);
  } catch (err) {
    postMessage({ id, error: String(err) } satisfies Response);
  }
};
