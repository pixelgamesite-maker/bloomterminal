import { toPath } from "@/lib/chart";

export function Sparkline({ vals, up }: { vals: number[]; up: boolean }) {
  const path = toPath(vals, 100, 30, 3);
  const color = up ? "var(--color-green)" : "var(--color-red)";
  return (
    <svg width="72" height="24" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function PriceChart({ vals, up }: { vals: number[]; up: boolean }) {
  const W = 320;
  const H = 150;
  const line = toPath(vals, W, H, 10);
  const area = `${line} L${W},${H} L0,${H} Z`;
  const color = up ? "var(--color-green)" : "var(--color-red)";
  const fill = up ? "rgba(55,168,107,0.14)" : "rgba(227,87,74,0.14)";
  return (
    <svg
      width="100%"
      height="170"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="price chart"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={i}
          x1={0}
          x2={W}
          y1={(i / 4) * H}
          y2={(i / 4) * H}
          stroke="var(--color-ink)"
          strokeOpacity={0.08}
        />
      ))}
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
