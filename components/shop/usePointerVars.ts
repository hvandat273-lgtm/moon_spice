"use client";

import { useEffect, type RefObject } from "react";

/**
 * Shared plumbing for the two pointer-driven effects, TiltCard and Magnetic.
 *
 * Both need the same three things: bail out where pointer motion is wrong
 * (coarse pointers, reduced motion), throttle to one write per frame, and
 * clean up every listener on unmount. Only the maths differs, so that is the
 * one thing the caller supplies.
 */
export function usePointerVars(
  ref: RefObject<HTMLElement | null>,
  compute: (position: { x: number; y: number; rect: DOMRect }) => Record<string, string>,
  reset: Record<string, string>,
  options: { flag?: string; enabled?: boolean } = {},
) {
  const { flag = "active", enabled = true } = options;

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    // A coarse pointer has no hover position to follow, and pointer-tracked
    // motion is exactly what reduced motion asks us to drop.
    if (typeof window.matchMedia !== "function") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const write = (vars: Record<string, string>) => {
      for (const [name, value] of Object.entries(vars)) node.style.setProperty(name, value);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        write(compute({ x: event.clientX, y: event.clientY, rect }));
      });
    };

    const onEnter = () => {
      node.dataset[flag] = "true";
    };

    const onLeave = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      delete node.dataset[flag];
      write(reset);
    };

    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerleave", onLeave);
    };
    // `compute` and `reset` are declared inline by every caller, so depending
    // on them would re-bind the listeners on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled, flag]);
}
