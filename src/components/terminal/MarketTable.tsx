import { MARKETS } from "@/lib/mock";
import { fmt, pct } from "@/lib/utils";

export function MarketTable({ limit }: { limit?: number }) {
  const rows = limit ? MARKETS.slice(0, limit) : MARKETS;
  return (
    <table className="agate text-[0.95rem]">
      <thead>
        <tr>
          <th>Issue</th>
          <th>Last</th>
          <th>Chg</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.symbol}>
            <td>
              <span className="font-head font-semibold">{m.symbol}</span>
              <span className="ml-2 text-sm text-ink-soft">{m.name}</span>
            </td>
            <td>{fmt(m.price)}</td>
            <td className={m.change >= 0 ? "text-up" : "text-down"}>{pct(m.change)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Movers() {
  const gainers = [...MARKETS].filter((m) => m.change >= 0).sort((a, b) => b.change - a.change);
  const losers = [...MARKETS].filter((m) => m.change < 0).sort((a, b) => a.change - b.change);
  return (
    <div className="space-y-1.5 tnum">
      {gainers.slice(0, 3).map((m) => (
        <div key={m.symbol} className="flex items-baseline justify-between border-b border-dotted border-rule pb-1">
          <span className="font-head font-semibold">{m.symbol}</span>
          <span className="text-up">▲ {pct(m.change)}</span>
        </div>
      ))}
      {losers.slice(0, 2).map((m) => (
        <div key={m.symbol} className="flex items-baseline justify-between border-b border-dotted border-rule pb-1">
          <span className="font-head font-semibold">{m.symbol}</span>
          <span className="text-down">▼ {pct(m.change)}</span>
        </div>
      ))}
    </div>
  );
}

/** A single scrolling ticker line for the masthead strip. */
export function TickerStrip() {
  const line = MARKETS.map((m) => (
    <span key={m.symbol} className="mx-5 tnum">
      <span className="font-head font-semibold">{m.symbol}</span>{" "}
      <span>{fmt(m.price)}</span>{" "}
      <span className={m.change >= 0 ? "text-up" : "text-down"}>
        {m.change >= 0 ? "▲" : "▼"}
        {pct(m.change)}
      </span>
    </span>
  ));
  return (
    <div className="ticker text-sm">
      <div className="ticker-track">
        {line}
        {line}
      </div>
    </div>
  );
}
