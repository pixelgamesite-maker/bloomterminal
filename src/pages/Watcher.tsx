import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, RefreshCw, Image as ImageIcon, ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  fetchTokens,
  fmtUsd,
  fmtCompact,
  fmtUsdCompact,
  fmtPct,
  spreadPct,
  rangePos,
  WatcherError,
  type Token,
  type Market,
} from "@/lib/watcher";

type Tab = "tokens" | "nfts";
const REFRESH_MS = 20_000;

export default function Watcher() {
  const [tab, setTab] = useState<Tab>("tokens");
  const [market, setMarket] = useState<Market>("stocks");
  const feed = useFeed(market);
  return (
    <div className="min-h-screen">
      <TopBar market={market} />
      <TickerTape tokens={feed.tokens} />
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button className="tab" data-active={tab === "tokens"} onClick={() => setTab("tokens")}>
              Tokens
            </button>
            <button className="tab" data-active={tab === "nfts"} onClick={() => setTab("nfts")}>
              NFTs
            </button>
          </div>
          {tab === "tokens" && (
            <div className="tabs">
              <button className="tab" data-active={market === "stocks"} onClick={() => setMarket("stocks")}>
                Tokenized stocks
              </button>
              <button className="tab" data-active={market === "crypto"} onClick={() => setMarket("crypto")}>
                Crypto
              </button>
            </div>
          )}
        </div>
        <div className="mt-4">{tab === "tokens" ? <TokensTab feed={feed} market={market} /> : <NftsTab />}</div>
      </div>
    </div>
  );
}

type Feed = ReturnType<typeof useFeed>;

/* ---------------- shared live feed ---------------- */

function useFeed(market: Market) {
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const prevMids = useRef<Map<string, number>>(new Map());
  const dir = useRef<Map<string, "up" | "down">>(new Map());
  const abort = useRef<AbortController | null>(null);
  const marketRef = useRef(market);
  marketRef.current = market;

  async function load() {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setRefreshing(true);
    try {
      const data = await fetchTokens(marketRef.current, ac.signal);
      if (ac.signal.aborted) return;
      const d = new Map<string, "up" | "down">();
      for (const t of data.tokens) {
        const prev = prevMids.current.get(t.symbol);
        if (prev != null && t.mid != null && t.mid !== prev) {
          d.set(t.symbol, t.mid > prev ? "up" : "down");
        }
        if (t.mid != null) prevMids.current.set(t.symbol, t.mid);
      }
      dir.current = d;
      setTokens(data.tokens);
      setUpdatedAt(new Date());
      setError(null);
      setTick((n) => n + 1);
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof WatcherError ? e.message : "Couldn't reach the price feed.");
    } finally {
      if (!ac.signal.aborted) setRefreshing(false);
    }
  }

  // Reload whenever the market changes; clear the old side's data + flashes.
  useEffect(() => {
    prevMids.current = new Map();
    dir.current = new Map();
    setTokens(null);
    setError(null);
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      clearInterval(id);
      abort.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);

  return { tokens, error, updatedAt, refreshing, tick, dir: dir.current, reload: load };
}

/* ---------------- top bar ---------------- */

function TopBar({ market }: { market: Market }) {
  const label = market === "stocks" ? "ROBINHOOD CHAIN · 4663" : "CRYPTO · TOP 50 · USD";
  return (
    <div className="sticky top-0 z-30 border-b-2 border-ink bg-screen/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-2.5 py-1 text-xs font-bold hover:bg-ink hover:text-screen"
          >
            <ArrowLeft size={14} /> Home
          </Link>
          <span className="pixel text-xs">
            BLOOM<span className="text-ink-soft"> // WATCHER</span>
            <span className="blink text-pink">_</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[0.65rem] text-ink-soft">
          <span className="dot dot-live" />
          <span className="pixel">{label}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ticker ---------------- */

function TickerTape({ tokens }: { tokens: Token[] | null }) {
  if (!tokens || tokens.length === 0) {
    return <div className="ticker"><div className="ticker-track pixel text-[0.6rem]">LIVE MARKET FEED · LOADING…</div></div>;
  }
  const line = tokens.slice(0, 40);
  const Item = ({ t }: { t: Token }) => (
    <span className="pixel text-[0.62rem]">
      {t.symbol} <span className="tnum">{fmtUsd(t.mid)}</span>
    </span>
  );
  return (
    <div className="ticker">
      <div className="ticker-track">
        {line.map((t) => (
          <Item key={`a-${t.symbol}`} t={t} />
        ))}
        {line.map((t) => (
          <Item key={`b-${t.symbol}`} t={t} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- tokens ---------------- */

type SortKey = "symbol" | "mid" | "change" | "bid" | "ask" | "spread" | "volume" | "range" | "mcap";
type SortDir = "asc" | "desc";

function TokensTab({ feed, market }: { feed: Feed; market: Market }) {
  const { tokens, error, updatedAt, refreshing, tick, dir, reload } = feed;
  const isCrypto = market === "crypto";
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "volume", dir: "desc" });

  // When flipping sides, a stock-only sort key (spread/bid/ask) makes no sense
  // for crypto, so fall back to volume.
  useEffect(() => {
    if (isCrypto && (sort.key === "spread" || sort.key === "bid" || sort.key === "ask")) {
      setSort({ key: "volume", dir: "desc" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCrypto]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "symbol" ? "asc" : "desc" }
    );
  }

  const rows = useMemo(() => {
    if (!tokens) return null;
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? tokens.filter((t) => t.symbol.toLowerCase().includes(needle) || t.name.toLowerCase().includes(needle))
      : tokens.slice();

    const val = (t: Token): number | string => {
      switch (sort.key) {
        case "symbol": return t.symbol;
        case "mid": return t.mid ?? -1;
        case "change": return t.change24h ?? -1e9;
        case "bid": return t.bid ?? -1;
        case "ask": return t.ask ?? -1;
        case "spread": return spreadPct(t) ?? 1e9;
        case "range": return rangePos(t) ?? -1;
        case "volume": return t.volume ?? -1;
        case "mcap": return t.marketCap ?? -1;
      }
    };
    filtered.sort((a, b) => {
      const av = val(a), bv = val(b);
      let c: number;
      if (typeof av === "string" && typeof bv === "string") c = av.localeCompare(bv);
      else c = (av as number) - (bv as number);
      return sort.dir === "asc" ? c : -c;
    });
    return filtered;
  }, [tokens, q, sort]);

  const stats = useMemo(() => {
    if (!tokens) return null;
    const spreads = tokens.map((t) => spreadPct(t)).filter((s): s is number => s != null);
    const avgSpread = spreads.length ? spreads.reduce((a, b) => a + b, 0) / spreads.length : null;
    const changes = tokens.filter((t) => t.change24h != null);
    const gainers = changes.filter((t) => (t.change24h as number) > 0).length;
    const hasChange = changes.length > 0;
    const totalVol = tokens.reduce((a, t) => a + (t.volume ?? 0), 0) || null;
    return { markets: tokens.length, avgSpread, gainers, decliners: changes.length - gainers, hasChange, totalVol };
  }, [tokens]);

  return (
    <div>
      {/* stat strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Markets" value={stats ? String(stats.markets) : "-"} />
        {isCrypto ? (
          <StatTile label="24h volume" value={fmtUsdCompact(stats?.totalVol ?? null)} hint="all markets" />
        ) : (
          <StatTile label="Avg spread" value={stats?.avgSpread != null ? `${stats.avgSpread.toFixed(2)}%` : "-"} />
        )}
        <StatTile
          label="24h movers"
          value={stats?.hasChange ? `${stats.gainers} / ${stats.decliners}` : "-"}
          hint={stats?.hasChange ? "up / down" : isCrypto ? "up / down" : "building history"}
        />
        <StatTile
          label="Updated"
          value={updatedAt ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-"}
          live
        />
      </div>

      {/* toolbar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={isCrypto ? "Search coin or ticker…" : "Search ticker or company…"}
            className="w-full rounded-lg border-2 border-ink bg-screen py-2 pl-9 pr-3 text-sm font-semibold outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-pink"
          />
        </div>
        <button
          onClick={reload}
          disabled={refreshing}
          title="Refresh"
          className="btn btn-yellow h-10 px-3"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* body */}
      {error && !tokens && (
        <div className="card-soft mt-3 p-6 text-center">
          <p className="display text-sm">The feed is quiet</p>
          <p className="mt-1 text-xs text-ink-soft">{error}</p>
          <button className="btn btn-pink mt-3 h-9 px-3 text-xs" onClick={reload}>Try again</button>
        </div>
      )}

      {!tokens && !error && (
        <div className="mt-3 space-y-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card-soft h-10 animate-pulse opacity-60" />
          ))}
        </div>
      )}

      {rows && (
        <div className="card mt-3 overflow-hidden">
          <div className="max-h-[70vh] overflow-auto">
            <table className="dex">
              <thead>
                <tr>
                  <th className="left" style={{ width: 40 }}>#</th>
                  <SortTh label="Market" k="symbol" sort={sort} onSort={toggleSort} align="left" />
                  <SortTh label="Price" k="mid" sort={sort} onSort={toggleSort} />
                  <SortTh label="24h" k="change" sort={sort} onSort={toggleSort} />
                  <th className="hidden sm:table-cell" style={{ width: 84 }}>Trend</th>
                  {isCrypto ? (
                    <SortTh label="Mkt cap" k="mcap" sort={sort} onSort={toggleSort} className="hidden md:table-cell" />
                  ) : (
                    <>
                      <SortTh label="Spread" k="spread" sort={sort} onSort={toggleSort} className="hidden md:table-cell" />
                      <SortTh label="Bid" k="bid" sort={sort} onSort={toggleSort} className="hidden lg:table-cell" />
                      <SortTh label="Ask" k="ask" sort={sort} onSort={toggleSort} className="hidden lg:table-cell" />
                    </>
                  )}
                  <th className="hidden xl:table-cell" style={{ width: 150 }}>Day range</th>
                  <SortTh label="Vol" k="volume" sort={sort} onSort={toggleSort} className="hidden md:table-cell" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="left py-8 text-center text-sm text-ink-soft">
                      No markets match "{q}".
                    </td>
                  </tr>
                ) : (
                  rows.map((t, i) => (
                    <Row key={t.symbol} t={t} rank={i + 1} flash={dir.get(t.symbol)} tick={tick} isCrypto={isCrypto} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-3 text-center text-[0.65rem] text-ink-soft">
        {isCrypto
          ? "Prices from CoinGecko, for information only, not a quote to trade."
          : "Prices from Robinhood Chain, for information only, not a quote to trade."}
      </p>
    </div>
  );
}

function SortTh({
  label,
  k,
  sort,
  onSort,
  align = "right",
  className = "",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <th className={`${align === "left" ? "left" : ""} ${className}`} onClick={() => onSort(k)}>
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {label}
        {active && (sort.dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </span>
    </th>
  );
}

function Row({ t, rank, flash, tick, isCrypto }: { t: Token; rank: number; flash?: "up" | "down"; tick: number; isCrypto: boolean }) {
  const spread = spreadPct(t);
  return (
    <tr>
      <td className="left mono text-[0.7rem] text-ink-soft">{rank}</td>
      <td className="left">
        <div className="flex items-center gap-2.5">
          <Logo t={t} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="display text-sm leading-none">{t.symbol}</span>
              {t.halted && <Badge variant="down">halt</Badge>}
            </div>
            <div className="truncate text-[0.68rem] leading-tight text-ink-soft" style={{ maxWidth: 180 }}>
              {t.name}
            </div>
          </div>
        </div>
      </td>
      <td className="num">
        {/* key on tick+flash so the flash animation re-fires each update */}
        <span key={`${tick}`} className={`display text-sm ${flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""} inline-block rounded px-1`}>
          {fmtUsd(t.mid)}
        </span>
      </td>
      <td className={`num display text-sm ${t.change24h == null ? "text-ink-soft" : t.change24h >= 0 ? "text-up" : "text-down"}`}>
        {fmtPct(t.change24h)}
      </td>
      <td className="hidden sm:table-cell">
        <div className="flex justify-end">
          <Sparkline data={t.spark} up={t.change24h == null ? null : t.change24h >= 0} />
        </div>
      </td>
      {isCrypto ? (
        <td className="num hidden text-ink-soft md:table-cell">{fmtUsdCompact(t.marketCap)}</td>
      ) : (
        <>
          <td className="num hidden md:table-cell">{spread != null ? `${spread.toFixed(2)}%` : "-"}</td>
          <td className="num hidden text-ink-soft lg:table-cell">{fmtUsd(t.bid)}</td>
          <td className="num hidden text-ink-soft lg:table-cell">{fmtUsd(t.ask)}</td>
        </>
      )}
      <td className="hidden xl:table-cell">
        <DayRange t={t} />
      </td>
      <td className="num hidden text-ink-soft md:table-cell">
        {isCrypto ? fmtUsdCompact(t.volume) : fmtCompact(t.volume)}
      </td>
    </tr>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean | null }) {
  if (!data || data.length < 2) return <span className="text-[0.6rem] text-ink-soft">-</span>;
  const w = 72, h = 22, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = up == null ? "var(--color-ink-soft)" : up ? "var(--color-green)" : "var(--color-red)";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block" aria-hidden>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Logo({ t }: { t: Token }) {
  const [broken, setBroken] = useState(false);
  if (t.logoUrl && !broken) {
    return (
      <img
        src={t.logoUrl}
        onError={() => setBroken(true)}
        className="h-7 w-7 flex-none rounded-full border-2 border-ink bg-screen object-contain"
        alt=""
      />
    );
  }
  return (
    <div className="grid h-7 w-7 flex-none place-items-center rounded-full border-2 border-ink bg-screen-2 pixel text-[0.52rem]">
      {t.symbol.slice(0, 2)}
    </div>
  );
}

function DayRange({ t }: { t: Token }) {
  const pos = rangePos(t);
  if (pos == null) return <span className="text-[0.65rem] text-ink-soft">no range</span>;
  return (
    <div className="w-[140px]">
      <div className="relative h-1.5 w-full rounded-full bg-screen-2">
        <div
          className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-ink"
          style={{ left: `calc(${pos * 100}% - 2px)` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[0.58rem] tabular-nums text-ink-soft">
        <span>{fmtUsd(t.dailyLow)}</span>
        <span>{fmtUsd(t.dailyHigh)}</span>
      </div>
    </div>
  );
}

function StatTile({ label, value, live, hint }: { label: string; value: string; live?: boolean; hint?: string }) {
  return (
    <div className="card-soft px-3 py-2">
      <div className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-wide text-ink-soft">
        {live && <span className="dot dot-live" style={{ width: 7, height: 7 }} />}
        {label}
      </div>
      <div className="display mt-0.5 text-base tabular-nums">{value}</div>
      {hint && <div className="text-[0.55rem] text-ink-soft">{hint}</div>}
    </div>
  );
}

/* ---------------- nfts ---------------- */

function NftsTab() {
  return (
    <div className="card-soft flex flex-col items-center p-10 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink bg-screen-2">
        <ImageIcon size={28} className="text-ink-soft" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <h2 className="display text-lg">NFT collections</h2>
        <Badge variant="yellow">Coming soon</Badge>
      </div>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        Floor prices, holders and the Bloom collection, wiring up to OpenSea next.
        Tokens are live now, check the Tokens tab.
      </p>
    </div>
  );
}
