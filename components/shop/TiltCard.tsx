"use client";

import { useRef, type ReactNode } from "react";

import { usePointerVars } from "./usePointerVars";

const MAX_TILT_DEG = 7;

/**
 * Tilts its child toward the cursor, so a flat card reads as a solid object.
 *
 * It writes two custom properties and nothing else — the visual treatment
 * lives in the `.tilt` class — so the wrapped markup is untouched for touch
 * users, for reduced-motion users, and before hydration.
 */
export function TiltCard({
  children,
  className,
  max = MAX_TILT_DEG,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  usePointerVars(
    ref,
    ({ x, y, rect }) => {
      const px = (x - rect.left) / rect.width - 0.5;
      const py = (y - rect.top) / rect.height - 0.5;
      // Pointer right tips the right edge away; pointer down tips the bottom
      // toward the viewer. Inverting Y is what makes it read as a solid object.
      return {
        "--tilt-y": `${(px * max * 2).toFixed(2)}deg`,
        "--tilt-x": `${(-py * max * 2).toFixed(2)}deg`,
      };
    },
    { "--tilt-x": "0deg", "--tilt-y": "0deg" },
    { flag: "tilting" },
  );

  return (
    <div className={className ? `tilt ${className}` : "tilt"} ref={ref}>
      {children}
    </div>
  );
}
