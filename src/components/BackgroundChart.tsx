import { series, toPath } from "@/lib/chart";

/**
 * Slow-scrolling grey market chart for the landing backdrop. Two identical
 * halves sit side by side and the track translates by -50% on a loop, so the
 * line never visibly jumps.
 */
export function BackgroundChart() {
  const W = 1200;
  const H = 400;
  const vals = series(60, 7, 1.1);
  const path = toPath(vals, W, H, 40);
  // candles for a little "stocks" texture
  const candles = series(30, 13, 1.4);

  const Half = ({ x }: { x: number }) => (
    <g transform={`translate(${x},0)`}>
      {/* faint vertical grid */}
      {Array.from({ length: 13 }).map((_, i) => (
        <line
          key={i}
          x1={(i / 12) * W}
          x2={(i / 12) * W}
          y1={0}
          y2={H}
          stroke="#2e2a3a"
          strokeOpacity={0.06}
        />
      ))}
      {/* candlesticks */}
      {candles.map((v, i) => {
        const cx = (i / (candles.length - 1)) * W;
        const up = i % 2 === 0;
        const bh = 24 + (v % 40);
        const cy = H * 0.3 + (v / 94) * (H * 0.4);
        return (
          <rect
            key={i}
            x={cx - 3}
            y={cy}
            width={6}
            height={bh}
            fill={up ? "#37a86b" : "#e3574a"}
            opacity={0.14}
          />
        );
      })}
      {/* the line */}
      <path d={path} fill="none" stroke="#5a5466" strokeWidth={2.5} strokeOpacity={0.4} />
    </g>
  );

  return (
    <div className="bg-chart" aria-hidden>
      <svg
        className="scroll"
        width="200%"
        viewBox={`0 0 ${W * 2} ${H}`}
        preserveAspectRatio="none"
      >
        <Half x={0} />
        <Half x={W} />
      </svg>
    </div>
  );
}
