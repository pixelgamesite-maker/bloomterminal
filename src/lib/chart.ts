// Tiny deterministic chart helpers — no deps, good enough for demo visuals.

/** Seeded random walk in the 5..95 range. */
export function series(n: number, seed = 1, vol = 1): number[] {
  let s = (seed * 9301) % 233280 || 1;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: number[] = [];
  let v = 50;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.48) * vol * 9;
    v = Math.max(6, Math.min(94, v));
    out.push(v);
  }
  return out;
}

/** Build an SVG path string from values mapped into a w×h box. */
export function toPath(vals: number[], w: number, h: number, pad = 0): string {
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const rng = max - min || 1;
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = pad + (h - pad * 2) - ((v - min) / rng) * (h - pad * 2);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
