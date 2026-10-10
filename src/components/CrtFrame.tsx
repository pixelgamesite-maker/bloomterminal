import type { ReactNode } from "react";

/**
 * App shell. Full-bleed: the screen fills the whole window, no dark TV trim.
 * Content scrolls with the window, like a normal terminal.
 */
export function CrtFrame({ children }: { children: ReactNode }) {
  return <div className="app-shell">{children}</div>;
}
