import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Wallet, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  claimCheck,
  claimSpot,
  claimStats,
  communityOf,
  COMMUNITIES,
  EVM_RE,
  type ClaimResult,
  type ClaimStats,
} from "@/lib/claim";

export default function Claim() {
  const [wallet, setWallet] = useState("");
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    claimStats().then(setStats).catch(() => {});
  }, []);

  async function check() {
    setErr(null);
    setResult(null);
    setDone(false);
    const w = wallet.trim();
    if (!EVM_RE.test(w)) {
      setErr("Paste a valid wallet address (0x + 40 hex).");
      return;
    }
    setChecking(true);
    const res = await claimCheck(w);
    setChecking(false);
    if (!res.ok) {
      setErr(res.error ?? "Couldn't check that wallet.");
      return;
    }
    setResult(res);
    if (res.taken != null && res.total != null && res.remaining != null) {
      setStats({ taken: res.taken, total: res.total, remaining: res.remaining });
    }
  }

  async function claim() {
    setErr(null);
    setClaiming(true);
    const res = await claimSpot(wallet.trim());
    setClaiming(false);
    if (!res.ok) {
      setErr(res.error ?? "Couldn't claim.");
      if (res.taken != null && res.total != null && res.remaining != null) {
        setStats({ taken: res.taken, total: res.total, remaining: res.remaining });
      }
      return;
    }
    setResult(res);
    // res.claimed = just claimed now; res.already = it was already claimed.
    setDone(Boolean(res.claimed));
    if (res.taken != null && res.total != null && res.remaining != null) {
      setStats({ taken: res.taken, total: res.total, remaining: res.remaining });
    }
  }

  const soldOut = stats ? stats.remaining <= 0 : false;

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <div className="sticky top-0 z-30 border-b-2 border-ink bg-screen/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-2.5 py-1 text-xs font-bold hover:bg-ink hover:text-screen"
          >
            <ArrowLeft size={14} /> Home
          </Link>
          <span className="pixel text-xs">
            BLOOM<span className="text-ink-soft"> // CLAIM</span>
            <span className="blink text-pink">_</span>
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-7">
        {/* hero + spots */}
        <div className="text-center">
          <h1 className="display text-3xl sm:text-4xl">Claim your spot</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Paste your wallet to see which community you're eligible for and claim one of
            1,000 spots. First come, first serve.
          </p>
        </div>

        <SpotsBar stats={stats} />

        {/* wallet input */}
        <div className="mt-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Wallet size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && check()}
                placeholder="0x your wallet address"
                spellCheck={false}
                className="w-full rounded-xl border-2 border-ink bg-screen py-3 pl-10 pr-3 font-mono text-sm outline-none placeholder:font-sans placeholder:text-ink-soft focus:ring-2 focus:ring-pink"
              />
            </div>
            <Button variant="pink" size="lg" className="sm:w-40" disabled={checking} onClick={check}>
              {checking ? <Loader2 size={16} className="animate-spin" /> : "Check"}
            </Button>
          </div>
          {err && <p className="mt-2 text-center text-xs text-red">{err}</p>}
        </div>

        {/* result */}
        {result && result.ok && (
          <ResultCard
            result={result}
            done={done}
            claiming={claiming}
            soldOut={soldOut}
            onClaim={claim}
          />
        )}

        {/* gallery */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="display text-lg">The communities</h2>
            <span className="pixel text-[0.6rem] text-ink-soft">{COMMUNITIES.length} collections</span>
          </div>
          <div ref={galleryRef} className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
            {COMMUNITIES.map((c) => (
              <div key={c.name} className="card-soft overflow-hidden">
                <div className="aspect-square w-full bg-screen-2">
                  <CommunityImg name={c.name} className="h-full w-full object-cover" />
                </div>
                <div className="truncate px-2 py-1.5 text-center text-[0.7rem] font-bold">{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[0.65rem] text-ink-soft">
          1,000 spots, first come first serve. One spot per eligible wallet.
        </p>
      </div>
    </div>
  );
}

function SpotsBar({ stats }: { stats: ClaimStats | null }) {
  const taken = stats?.taken ?? 0;
  const total = stats?.total ?? 1000;
  const pct = Math.min(100, (taken / total) * 100);
  return (
    <div className="card mt-5 p-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="pixel text-[0.55rem] text-ink-soft">SPOTS CLAIMED</div>
          <div className="display text-2xl tabular-nums">
            {stats ? `${taken.toLocaleString()} / ${total.toLocaleString()}` : "— / 1,000"}
          </div>
        </div>
        <div className="text-right">
          <div className="pixel text-[0.55rem] text-ink-soft">REMAINING</div>
          <div className="display text-2xl tabular-nums text-green">
            {stats ? stats.remaining.toLocaleString() : "—"}
          </div>
        </div>
      </div>
      <div className="meter mt-3">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ResultCard({
  result,
  done,
  claiming,
  soldOut,
  onClaim,
}: {
  result: ClaimResult;
  done: boolean;
  claiming: boolean;
  soldOut: boolean;
  onClaim: () => void;
}) {
  const comms = (result.communities ?? []).map((n) => communityOf(n));
  // claim_spot responses carry no `eligible` flag, so treat a claim/already
  // result (which only comes back for eligible wallets) as eligible too.
  const eligible = Boolean(
    result.eligible || result.claimed || result.already || done || comms.length > 0
  );
  const alreadyClaimed = Boolean(result.already || (result.claimed && !done));

  if (!eligible) {
    return (
      <div className="card-soft mt-5 p-6 text-center">
        <div className="display text-sm">Not on the list</div>
        <p className="mt-1 text-xs text-ink-soft">
          This wallet isn't eligible. Double-check you pasted the right address.
        </p>
      </div>
    );
  }

  return (
    <div className="card mt-5 p-5">
      {done ? (
        <div className="flex items-center justify-center gap-2 text-green">
          <Sparkles size={18} />
          <span className="display text-lg">You're in! Spot reserved.</span>
        </div>
      ) : alreadyClaimed ? (
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 size={18} className="text-green" />
          <span className="display text-lg">Already claimed</span>
        </div>
      ) : (
        <div className="text-center">
          <div className="display text-lg">You're eligible</div>
          <p className="mt-0.5 text-xs text-ink-soft">
            Eligible for {comms.length > 1 ? "these communities" : "this community"}:
          </p>
        </div>
      )}

      {/* eligible communities */}
      <div className="mt-4 flex flex-wrap items-stretch justify-center gap-3">
        {comms.map((c) => (
          <div key={c.name} className="card-soft w-28 overflow-hidden">
            <div className="aspect-square w-full bg-screen-2">
              <CommunityImg name={c.name} className="h-full w-full object-cover" />
            </div>
            <div className="truncate px-2 py-1.5 text-center text-xs font-bold">{c.name}</div>
          </div>
        ))}
      </div>

      {/* action */}
      {!done && !alreadyClaimed && (
        <div className="mt-5">
          {soldOut ? (
            <Button variant="pink" size="lg" className="w-full" disabled>
              All spots claimed
            </Button>
          ) : (
            <Button variant="pink" size="lg" className="w-full" disabled={claiming} onClick={onClaim}>
              {claiming ? <Loader2 size={16} className="animate-spin" /> : "Claim your spot"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function CommunityImg({ name, className }: { name: string; className?: string }) {
  const c = communityOf(name);
  const [broken, setBroken] = useState(false);
  if (!c.img || broken) {
    return (
      <div className={`grid place-items-center bg-screen-2 ${className ?? ""}`}>
        <span className="pixel text-xs text-ink-soft">{name.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return <img src={c.img} onError={() => setBroken(true)} className={className} alt={name} />;
}
