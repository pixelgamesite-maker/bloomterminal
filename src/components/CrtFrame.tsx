import type { ReactNode } from "react";

/**
 * The television. Everything renders "inside the glass": a rounded screen
 * with a dark vignette and faint scanlines riding on top, content scrolling
 * underneath. The dark edges give the feeling of looking into an old tube.
 */
export function CrtFrame({ children }: { children: ReactNode }) {
  return (
    <div className="crt-room">
      <div className="crt-screen">
        <div className="crt-scroll">{children}</div>
        <div className="crt-veil" aria-hidden />
      </div>
    </div>
  );
}
