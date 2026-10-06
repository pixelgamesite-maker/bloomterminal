import { MARKETS } from "@/lib/mock";
import { fmt, pct } from "@/lib/utils";

export function MarketTable({ limit }: { limit?: number }) {
  const rows = limit ? MARKETS.slice(0, limit) : MARKETS;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
          <th className="pb-2 text-left font-medium">Asset</th>
          <th className="pb-2 text-right font-medium">Price</th>
          <th className="pb-2 text-right font-medium">Change</th>
        </tr>
      </thead>
      <tbody className="tnum">
        {rows.map((m) => (
          <tr key={m.symbol} className="border-t border-border/60">
            <td className="py-1.5">
              <span className="font-mono font-medium">{m.symbol}</span>
              <span className="ml-2 text-xs text-muted-foreground">{m.name}</span>
            </td>
            <td className="py-1.5 text-right">${fmt(m.price)}</td>
            <td
              className={`py-1.5 text-right ${m.change >= 0 ? "text-up" : "text-down"}`}
            >
              {pct(m.change)}
            </td>
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
    <div className="space-y-1 tnum text-sm">
      {gainers.slice(0, 3).map((m) => (
        <div key={m.symbol} className="flex items-center justify-between">
          <span className="text-up">▲ {m.symbol}</span>
          <span className="text-up">{pct(m.change)}</span>
        </div>
      ))}
      {losers.slice(0, 2).map((m) => (
        <div key={m.symbol} className="flex items-center justify-between">
          <span className="text-down">▼ {m.symbol}</span>
          <span className="text-down">{pct(m.change)}</span>
        </div>
      ))}
    </div>
  );
}
