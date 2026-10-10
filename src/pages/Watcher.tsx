import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, RefreshCw, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchTokens,
  fmtUsd,
  fmtCompact,
  spreadPct,
  WatcherError,
  type Token,
} from "@/lib/watcher";

type Tab = "tokens" | "nfts";
const REFRESH_MS = 20_000;

export default function Watcher() {
  const [tab, setTab] = useState<Tab>("tokens");

  return (
    <div className="mx-auto max-w-3xl px-5 py-5">
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

      <div className="boot mt-5">
        <h1 className="display text-2xl sm:text-3xl">Watcher</h1>
        <p className="mt-1 max-w-lg text-sm text-ink-soft">
          Live tokenized stocks on Robinhood Chain, and the Bloom NFT collection.
          Public — no sign-in needed.
        </p>
      </div>

      {/* tabs */}
      <div className="mt-5 flex gap-2">
        <TabButton active={tab === "tokens"} onClick={() => setTab("tokens")}>
          Tokens
        </TabButton>
        <TabButton active={tab === "nfts"} onClick={() => setTab("nfts")}>
          NFTs
        </TabButton>
      </div>

      <div className="mt-4">{tab === "tokens" ? <TokensTab /> : <NftsTab />}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "display rounded-lg border-2 border-ink px-4 py-1.5 text-sm transition-transform " +
        (active
          ? "bg-ink text-screen"
          : "bg-screen hover:-translate-y-0.5 hover:bg-screen-2")
      }
    >
      {children}
    </button>
  );
}

/* ---------------- Tokens ---------------- */

function TokensTab() {
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const abort = useRef<AbortController | null>(null);

  async function load() {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setRefreshing(true);
    try {
      const data = await fetchTokens(ac.signal);
      if (ac.signal.aborted) return;
      setTokens(data.tokens);
      setUpdatedAt(new Date());
      setError(null);
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof WatcherError ? e.message : "Couldn't reach the price feed.");
    } finally {
      if (!ac.signal.aborted) setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      clearInterval(id);
      abort.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!tokens) return null;
    const needle = q.trim().toLowerCase();
    if (!needle) return tokens;
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(needle) || t.name.toLowerCase().includes(needle)
    );
  }, [tokens, q]);

  return (
    <div>
      {/* controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search symbol or name…"
            className="w-full rounded-lg border-2 border-ink bg-screen py-2 pl-9 pr-3 text-sm font-semibold outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-pink"
          />
        </div>
        <Button
          variant="yellow"
          size="sm"
          onClick={load}
          disabled={refreshing}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* status line */}
      <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
        <span>
          {tokens ? `${filtered?.length ?? 0} of ${tokens.length} tokens` : "Loading feed…"}
        </span>
        {updatedAt && (
          <span>
            Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      {/* body */}
      {error && !tokens && (
        <div className="card-soft mt-3 p-6 text-center">
          <p className="display text-sm">The feed is quiet</p>
          <p className="mt-1 text-xs text-ink-soft">{error}</p>
          <Button variant="pink" size="sm" className="mt-3" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {!tokens && !error && (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-soft h-[62px] animate-pulse opacity-60" />
          ))}
        </div>
      )}

      {filtered && (
        <div className="mt-3 space-y-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No tokens match "{q}".</p>
          ) : (
            filtered.map((t) => <TokenRow key={t.symbol} t={t} />)
          )}
        </div>
      )}

      <p className="mt-4 text-center text-[0.65rem] text-ink-soft">
        Prices from Robinhood Chain · for information only, not a quote to trade.
      </p>
    </div>
  );
}

function TokenRow({ t }: { t: Token }) {
  const spread = spreadPct(t);
  return (
    <div className="card-soft flex items-center gap-3 p-3">
      <Logo t={t} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="display text-sm">{t.symbol}</span>
          {t.halted && <Badge variant="down">halted</Badge>}
        </div>
        <p className="truncate text-xs text-ink-soft">{t.name}</p>
      </div>

      <div className="hidden w-32 flex-none sm:block">
        <DayRange t={t} />
      </div>

      <div className="w-24 flex-none text-right">
        <div className="display text-sm">{fmtUsd(t.mid)}</div>
        <div className="text-[0.65rem] text-ink-soft">
          {spread != null ? `${spread.toFixed(2)}% spr` : t.volume != null ? `vol ${fmtCompact(t.volume)}` : "—"}
        </div>
      </div>
    </div>
  );
}

function Logo({ t }: { t: Token }) {
  const [broken, setBroken] = useState(false);
  if (t.logoUrl && !broken) {
    return (
      <img
        src={t.logoUrl}
        onError={() => setBroken(true)}
        className="h-9 w-9 flex-none rounded-full border-2 border-ink bg-screen object-contain"
        alt=""
      />
    );
  }
  return (
    <div className="grid h-9 w-9 flex-none place-items-center rounded-full border-2 border-ink bg-screen-2 pixel text-[0.6rem]">
      {t.symbol.slice(0, 2)}
    </div>
  );
}

/** A little bar showing where the mid sits between the day's low and high. */
function DayRange({ t }: { t: Token }) {
  if (t.dailyLow == null || t.dailyHigh == null || t.mid == null || t.dailyHigh <= t.dailyLow) {
    return <div className="text-right text-[0.65rem] text-ink-soft">no range</div>;
  }
  const pct = Math.max(0, Math.min(1, (t.mid - t.dailyLow) / (t.dailyHigh - t.dailyLow)));
  return (
    <div>
      <div className="relative h-1.5 w-full rounded-full bg-screen-2">
        <div
          className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-ink"
          style={{ left: `calc(${pct * 100}% - 2px)` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[0.6rem] text-ink-soft">
        <span>{fmtUsd(t.dailyLow)}</span>
        <span>{fmtUsd(t.dailyHigh)}</span>
      </div>
    </div>
  );
}

/* ---------------- NFTs ---------------- */

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
        Floor prices, holders and the Bloom collection — wiring up to OpenSea next.
        Tokens are live now; check the Tokens tab.
      </p>
    </div>
  );
}
