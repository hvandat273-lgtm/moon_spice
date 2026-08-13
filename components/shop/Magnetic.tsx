import type { ReactNode } from "react";

/**
 * Stable wrapper retained so existing layouts keep the same inline sizing.
 * Pointer attraction is deliberately disabled: calls to action must remain
 * under the cursor instead of shifting while a visitor tries to click them.
 */
export function Magnetic({ children }: { children: ReactNode }) {
  return <span className="magnetic">{children}</span>;
}
