import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceChart, Sparkline } from "@/components/Chart";
import { series } from "@/lib/chart";
import { fmt, pct, cn } from "@/lib/utils";

// Robinhood-chain style listings. Demo data for now.
interface Coin {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const COINS: Coin[] = [
  { symbol: "NVDA", name: "NVIDIA", price: 184.22, change: 4.21 },
  { symbol: "TSLA", name: "Tesla", price: 427.18, change: -1.83 },
  { symbol: "AAPL", name: "Apple", price: 242.91, change: 0.92 },
  { symbol: "MSFT", name: "Microsoft", price: 512.07, change: 3.72 },
  { symbol: "GOOGL", name: "Alphabet", price: 201.44, change: 1.38 },
  { symbol: "AMZN", name: "Amazon", price: 231.6, change: -0.44 },
  { symbol: "COIN", name: "Coinbase", price: 356.9, change: 6.41 },
  { symbol: "MSTR", name: "MicroStrategy", price: 402.55, change: 3.72 },
];

const seed = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
const TIMEFRAMES = ["1D", "1W", "1M", "1Y"];

export default function Watcher() {
  const [active, setActive] = useState(COINS[0].symbol);
  const [tf, setTf] = useState("1D");
  const coin = COINS.find((c) => c.symbol === active)!;
  const chartVals = useMemo(
    () => series(48, seed(active) + tf.length * 7, 1.2),
    [active, tf]
  );

  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-screen"
        >
          <ArrowLeft size={15} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <img src="/robinhood-watcher.png" className="pixel h-8 w-auto" alt="" />
          <span className="pixel text-xs">WATCHER</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <h1 className="display text-2xl">Robinhood Watcher</h1>
        <Badge variant="yellow">Preview</Badge>
      </div>
      <p className="text-sm text-ink-soft">Demo data — a live Robinhood feed drops in later.</p>

      {/* featured chart */}
      <div className="card mt-4 p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="display text-xl">{coin.symbol}</div>
            <div className="text-sm text-ink-soft">{coin.name}</div>
          </div>
          <div className="text-right">
            <div className="display text-2xl tnum">${fmt(coin.price)}</div>
            <div className={cn("text-sm tnum", coin.change >= 0 ? "text-up" : "text-down")}>
              {pct(coin.change)}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <PriceChart vals={chartVals} up={coin.change >= 0} />
        </div>

        <div className="mt-3 flex gap-2">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={cn("chip", tf === t && "bg-ink text-screen")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* listings */}
      <div className="mt-4 space-y-2">
        <div className="pixel text-[0.6rem] text-ink-soft">MARKETS</div>
        {COINS.map((c) => (
          <button
            key={c.symbol}
            onClick={() => setActive(c.symbol)}
            className={cn(
              "card-soft flex w-full items-center gap-3 p-3 text-left transition-transform hover:-translate-y-0.5",
              active === c.symbol && "ring-2 ring-ink"
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="font-bold">{c.symbol}</div>
              <div className="truncate text-xs text-ink-soft">{c.name}</div>
            </div>
            <Sparkline vals={series(48, seed(c.symbol), 1.2)} up={c.change >= 0} />
            <div className="w-24 text-right">
              <div className="tnum text-sm">${fmt(c.price)}</div>
              <div className={cn("tnum text-xs", c.change >= 0 ? "text-up" : "text-down")}>
                {pct(c.change)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
