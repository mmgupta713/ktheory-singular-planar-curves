import { LIMITS, Params } from "../lib/params";
import { Tex } from "./Tex";

const FIELDS: { key: keyof Params; tex: string; hint: string }[] = [
  { key: "a", tex: "a", hint: "exponent of y" },
  { key: "b", tex: "b", hint: "exponent of x" },
  { key: "r", tex: "r", hint: "group K₂ᵣ" },
  { key: "p", tex: "p", hint: "prime = char k" },
  { key: "r1", tex: "r_1", hint: "range of r: from" },
  { key: "r2", tex: "r_2", hint: "range of r: to" },
];

export function ParamPanel({
  params,
  set,
  error,
}: {
  params: Params;
  set: (patch: Partial<Params>) => void;
  error: string | null;
}) {
  return (
    <fieldset className="params">
      <legend>Parameters</legend>
      <div className="param-row">
        {FIELDS.map(({ key, tex, hint }) => (
          <label key={key} className="param">
            <span className="param-name">
              <Tex>{tex}</Tex>
            </span>
            <input
              type="number"
              min={LIMITS[key][0]}
              max={LIMITS[key][1]}
              step={1}
              value={Number.isNaN(params[key]) ? "" : params[key]}
              onChange={(e) => set({ [key]: e.currentTarget.valueAsNumber })}
            />
            <span className="param-hint">{hint}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          ⚠ {error}
        </p>
      )}
    </fieldset>
  );
}
