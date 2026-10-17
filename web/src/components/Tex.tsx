import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

export function Tex({ children, display = false }: { children: string; display?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: display, throwOnError: false }),
    [children, display],
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
