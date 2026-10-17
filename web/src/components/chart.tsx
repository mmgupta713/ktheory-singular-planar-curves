// Small shared pieces for the figures: container width, dark-mode flag, tooltip, palette.
import { ReactNode, RefObject, useEffect, useState } from "react";

export function useWidth(ref: RefObject<HTMLElement>): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export function useDark(): boolean {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const [dark, setDark] = useState(mq.matches);
  useEffect(() => {
    const f = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [mq]);
  return dark;
}

// Sequential blue ramp (reference palette steps 100..700) and neutral chrome.
const BLUE = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b"];
const CHROME = {
  // excluded (p | m') cells are the bare surface plus a hatch, so they read as "absent", not as h = 0
  light: { zero: "#e1e0d9", excluded: "#fcfcfb", hatch: "#d6d5ce", ring: "#0b0b0b" },
  dark: { zero: "#383835", excluded: "#1a1a19", hatch: "#383835", ring: "#f0efec" },
};

/** Colors for h = 1..maxH, evenly spread over the ramp (lightest kept >= step 250 for contrast). */
export function hColors(maxH: number, dark: boolean): string[] {
  const ramp = dark ? BLUE.slice(1, 9).reverse() : BLUE.slice(2);
  if (maxH <= 1) return [ramp[Math.floor(ramp.length / 2)]];
  return Array.from({ length: maxH }, (_, i) => ramp[Math.round((i * (ramp.length - 1)) / (maxH - 1))]);
}
export const chrome = (dark: boolean) => (dark ? CHROME.dark : CHROME.light);

export function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  // keep the box inside the chart: flip to the left of the cursor near the right edge
  const flip = x > width - 200;
  return (
    <div
      className="tooltip"
      style={{ top: y, left: flip ? undefined : x + 14, right: flip ? width - x + 14 : undefined }}
    >
      {children}
    </div>
  );
}

/** "Nice" integer tick step so that about `target` ticks fit. */
export function tickStep(span: number, target: number): number {
  const raw = Math.max(1, span / target);
  const pow = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * pow >= raw) return m * pow;
  return 10 * pow;
}
