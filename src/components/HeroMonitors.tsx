import type { CSSProperties } from "react";

interface Mon {
  key: string;
  src: string;
  tip: string;
  glow: string;
  style: CSSProperties;
  onClick: () => void;
  alt: string;
}

/**
 * The four monitors, composed as separate clickable sprites laid out like the
 * old collage. Each glows (TV effect) and lifts on hover; tapping routes
 * where the user asked.
 */
export function HeroMonitors({
  onRegister,
  onWatcher,
  onHolders,
  onOpensea,
}: {
  onRegister: () => void;
  onWatcher: () => void;
  onHolders: () => void;
  onOpensea: () => void;
}) {
  const mons: Mon[] = [
    {
      key: "opensea",
      src: "/opensea-monitor.png",
      tip: "OpenSea",
      glow: "rgba(58,160,255,0.65)",
      style: { left: "28%", top: "0%", width: "40%", zIndex: 2 },
      onClick: onOpensea,
      alt: "OpenSea — coming soon",
    },
    {
      key: "robinhood",
      src: "/robinhood-watcher.png",
      tip: "Robinhood Watcher",
      glow: "rgba(159,255,42,0.6)",
      style: { left: "19%", top: "25%", width: "62%", zIndex: 3 },
      onClick: onWatcher,
      alt: "Open the Robinhood watcher",
    },
    {
      key: "orange",
      src: "/orange-monitor.png",
      tip: "Holders DEX",
      glow: "rgba(176,123,255,0.6)",
      style: { left: "-1%", top: "33%", width: "37%", zIndex: 4 },
      onClick: onHolders,
      alt: "Holders DEX — coming soon",
    },
    {
      key: "red",
      src: "/red-monitor.png",
      tip: "Register your worker",
      glow: "rgba(243,233,198,0.7)",
      style: { left: "6%", top: "49%", width: "66%", zIndex: 5 },
      onClick: onRegister,
      alt: "Register your worker",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md" style={{ aspectRatio: "1 / 1" }}>
      {mons.map((m) => (
        <button
          key={m.key}
          className="mon"
          style={{ ...m.style, ["--glow" as string]: m.glow }}
          onClick={m.onClick}
          aria-label={m.alt}
        >
          <img src={m.src} alt="" />
          <span className="mon-tip">{m.tip}</span>
        </button>
      ))}
    </div>
  );
}
