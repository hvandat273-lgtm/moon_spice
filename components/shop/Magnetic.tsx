"use client";

import { useRef, type ReactNode } from "react";

import { usePointerVars } from "./usePointerVars";

/**
 * Leans its child toward the cursor as the cursor approaches, and springs it
 * back on leave. Used on the primary calls to action.
 *
 * The pull is clamped hard: a button that follows the cursor far enough to
 * move out from under it is a button that is difficult to click.
 */
export function Magnetic({ children, strength = 0.28, max = 10 }: { children: ReactNode; strength?: number; max?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  usePointerVars(
    ref,
    ({ x, y, rect }) => {
      const dx = x - (rect.left + rect.width / 2);
      const dy = y - (rect.top + rect.height / 2);
      const clamp = (value: number) => Math.max(-max, Math.min(max, value * strength));
      return { "--pull-x": `${clamp(dx).toFixed(1)}px`, "--pull-y": `${clamp(dy).toFixed(1)}px` };
    },
    { "--pull-x": "0px", "--pull-y": "0px" },
    { flag: "pulling" },
  );

  return (
    <span className="magnetic" ref={ref}>
      {children}
    </span>
  );
}
