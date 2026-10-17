import * as Tabs from "@radix-ui/react-tabs";
import { ReactNode } from "react";
import { Heatmap } from "./components/Heatmap";
import { HPlot } from "./components/HPlot";
import { ParamPanel } from "./components/ParamPanel";
import { Summary } from "./components/Summary";
import { Tex } from "./components/Tex";
import { Decomposition, Grid, Row, usePy, usePyReady } from "./lib/compute";
import { useDebounced, useParams, validate } from "./lib/params";

export default function App() {
  const [params, set] = useParams();
  const q = useDebounced(params);
  const error = validate(params);
  const valid = validate(q) === null;
  const { a, b, r, p, R } = q;

  const ready = usePyReady();
  const dec = usePy<Decomposition>("decompose", valid ? [a, b, r, p] : null);
  const ser = usePy<Row[]>("series", valid ? [a, b, r, p] : null);
  const grid = usePy<Grid>("grid", valid ? [a, b, p, R] : null);

  return (
    <main className="App">
      <h1>
        <Tex>K</Tex>-theory of planar cuspidal curves
      </h1>
      <p className="intro">
        Interactive companion to Hesselholt–Nikolaus,{" "}
        <cite>
          <a href="https://arxiv.org/abs/1903.08295" target="_blank" rel="noreferrer">
            Algebraic <Tex>K</Tex>-theory of planar cuspidal curves
          </a>
        </cite>
        . For relatively prime <Tex>{`a, b \\ge 2`}</Tex> and a perfect field <Tex>k</Tex> of characteristic{" "}
        <Tex>p</Tex>, <Tex>{`K_{2r}(k[x,y]/(y^a - x^b), (x,y)) \\cong \\prod_{m'} W_h(k)`}</Tex> with{" "}
        <Tex>{`h = h(a,b,r,p,m')`}</Tex>. Every number on this page is computed in your browser by the
        same Python code (<code>cusp_h.py</code>) used for the research, via Pyodide. Source on{" "}
        <a href="https://github.com/mmgupta713/PhD" target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </p>

      <ParamPanel params={params} set={set} error={error} />

      {!ready ? (
        <p className="status">Loading Python runtime… (first visit downloads ~10 MB)</p>
      ) : (
        <Tabs.Root className="TabsRoot" defaultValue="summary">
          <Tabs.List className="TabsList" aria-label="Figures">
            <Tabs.Trigger className="TabsTrigger" value="summary">
              Decomposition
            </Tabs.Trigger>
            <Tabs.Trigger className="TabsTrigger" value="plot">
              <Tex>h</Tex>&nbsp;vs&nbsp;<Tex>m'</Tex>
            </Tabs.Trigger>
            <Tabs.Trigger className="TabsTrigger" value="heatmap">
              Heatmap over&nbsp;<Tex>{`(m', r)`}</Tex>
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="TabsContent" value="summary">
            <Pane state={dec}>{(d) => <Summary params={q} data={d} />}</Pane>
          </Tabs.Content>
          <Tabs.Content className="TabsContent" value="plot">
            <Pane state={ser}>{(d) => <HPlot params={q} rows={d} />}</Pane>
          </Tabs.Content>
          <Tabs.Content className="TabsContent" value="heatmap">
            <Pane state={grid}>{(d) => <Heatmap params={q} grid={d} onPickR={(r) => set({ r })} />}</Pane>
          </Tabs.Content>
        </Tabs.Root>
      )}
    </main>
  );
}

/** Shows the last good result (dimmed while recomputing), or the Python error. */
function Pane<T>({
  state,
  children,
}: {
  state: { data?: T; error?: string; loading: boolean };
  children: (d: T) => ReactNode;
}) {
  if (state.error) return <p className="error">⚠ {state.error}</p>;
  if (!state.data) return <p className="status">Computing…</p>;
  return <div style={{ opacity: state.loading ? 0.5 : 1, transition: "opacity 150ms" }}>{children(state.data)}</div>;
}
