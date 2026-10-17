import { Decomposition, Group } from "../lib/compute";
import { Params } from "../lib/params";
import { Tex } from "./Tex";

/** LaTeX for the product, e.g. W_{2}(k)^{3} \times W_{1}(k)^{3}, or 0. */
export function wittProduct(multiplicities: Group["multiplicities"]): string {
  return multiplicities.length
    ? multiplicities.map(([h, n]) => `W_{${h}}(k)${n > 1 ? `^{${n}}` : ""}`).join(" \\times ")
    : "0";
}

export function Summary({ params: { a, b, r, p }, data }: { params: Params; data: Decomposition }) {
  const rhs = wittProduct(data.multiplicities);
  const ok = data.total === data.expected;

  return (
    <div className="summary">
      <p>
        For a perfect field <Tex>k</Tex> of characteristic <Tex>{`p = ${p}`}</Tex>:
      </p>
      <Tex display>{`K_{${2 * r}}\\big(k[x,y]/(y^{${a}} - x^{${b}}),\\,(x,y)\\big) \\;\\cong\\; ${rhs}`}</Tex>

      <p className={ok ? "check ok" : "check bad"}>
        {ok ? "✓" : "✗"} Total length <Tex>{`\\textstyle\\sum_{m'} h = ${data.total}`}</Tex>
        {ok ? " equals " : " differs from "}
        <Tex>{`\\tfrac{(2r+1)(a-1)(b-1)}{2} = ${data.expected}`}</Tex>
      </p>

      {data.factors.length > 0 && (
        <table className="factors">
          <caption>
            Nonzero factors <Tex>{`W_h(k)`}</Tex>, indexed by <Tex>{`m' \\ge 1,\\ p \\nmid m'`}</Tex>
          </caption>
          <thead>
            <tr>
              <th>
                <Tex>m'</Tex>
              </th>
              <th>
                <Tex>{`\\ell(a,b,m')`}</Tex>
              </th>
              <th>
                <Tex>s</Tex>
              </th>
              <th>case</th>
              <th>
                <Tex>h</Tex>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.factors.map((f) => (
              <tr key={f.m}>
                <td>{f.m}</td>
                <td>{f.ell}</td>
                <td>{f.s}</td>
                <td className="muted">{f.case}</td>
                <td>
                  <strong>{f.h}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
