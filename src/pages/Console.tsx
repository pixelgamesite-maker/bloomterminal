import { useEffect, useState } from "react";
import { Rocket, Pause, Play, Copy, Check, UserPlus, Sparkles, Coins, Lock } from "lucide-react";
import { useTerminal } from "@/state/terminal";
import { ProfileMenu } from "@/components/ProfileMenu";
import { TvArt } from "@/components/TvArt";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusDot } from "@/components/StatusDot";
import { WORKER_CLASSES, MARKET_CATEGORIES, assetsByCategory, MARKETS } from "@/lib/mock";
import { CLASS_ART, DEFAULT_TV, LOGO } from "@/lib/art";
import { ECONOMY, BRAND } from "@/lib/config";
import type { AgentStatus, WorkerClass } from "@/lib/types";
import { cn, fmt, pct, duration } from "@/lib/utils";

type Tab = "worker" | "missions" | "agents" | "rewards";

const TABS: { id: Tab; label: string }[] = [
  { id: "worker", label: "Worker" },
  { id: "missions", label: "Missions" },
  { id: "agents", label: "Agents" },
  { id: "rewards", label: "Rewards" },
];

export default function Console() {
  const [tab, setTab] = useState<Tab>("worker");

  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={LOGO} className="pixel h-7 w-7 rounded-md" alt="" />
          <span className="pixel text-xs">BLOOM</span>
        </div>
        <ProfileMenu />
      </div>

      {/* tabs */}
      <div className="mt-5 flex justify-center">
        <div className="tabs">
          {TABS.map((x) => (
            <button key={x.id} className="tab" data-active={tab === x.id} onClick={() => setTab(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {tab === "worker" && <WorkerTab setTab={setTab} />}
        {tab === "missions" && <MissionsTab />}
        {tab === "agents" && <AgentsTab />}
        {tab === "rewards" && <RewardsTab />}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Worker */

function WorkerTab({ setTab }: { setTab: (t: Tab) => void }) {
  const t = useTerminal();
  if (t.worker) return <WorkerCard />;
  if (t.eligible) return <CreateWorker />;
  return <Locked setTab={setTab} />;
}

function Locked({ setTab }: { setTab: (t: Tab) => void }) {
  const t = useTerminal();
  const needs = [
    { ok: t.walletConnected, label: "Bind your wallet", action: t.connectWallet },
    { ok: t.missionsComplete, label: "Finish missions", action: () => setTab("missions") },
    {
      ok: t.activeAgents >= ECONOMY.requiredAgents,
      label: `Activate ${ECONOMY.requiredAgents} agents`,
      action: () => setTab("agents"),
    },
  ];
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <TvArt src={DEFAULT_TV} size={150} className="opacity-70" />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <Badge variant="yellow">
            <Lock size={11} /> locked
          </Badge>
        </span>
      </div>
      <h2 className="display mt-6 text-2xl">A few things first</h2>
      <p className="mt-1 text-sm text-ink-soft">Clear these to register your worker.</p>

      <div className="mt-5 w-full space-y-2">
        {needs.map((n) => (
          <button
            key={n.label}
            onClick={n.action}
            disabled={n.ok}
            className={cn(
              "card-soft flex w-full items-center gap-3 p-3 text-left",
              n.ok && "opacity-60"
            )}
          >
            <span
              className={cn(
                "grid h-7 w-7 flex-none place-items-center rounded-full border-2 border-ink",
                n.ok ? "bg-green text-white" : "bg-screen"
              )}
            >
              {n.ok ? <Check size={14} /> : ""}
            </span>
            <span className="flex-1 font-bold">{n.label}</span>
            {!n.ok && <span className="pixel text-[0.6rem] text-ink-soft">GO →</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function CreateWorker() {
  const t = useTerminal();
  const [name, setName] = useState("");
  const [cls, setCls] = useState<WorkerClass | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [asset, setAsset] = useState<string | null>(null);
  const ready = name.trim() && cls && category && asset;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="display text-2xl">Register a worker</h2>
        <p className="mt-1 text-sm text-ink-soft">Name it, pick a face, give it a market.</p>
      </div>

      {/* name */}
      <div className="flex items-center rounded-xl border-2 border-ink bg-screen px-3 h-12">
        <span className="text-ink-soft">&gt;</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 14))}
          placeholder="name your worker"
          className="ml-2 w-full bg-transparent font-display text-lg font-bold outline-none placeholder:text-ink-soft/50"
        />
      </div>

      {/* class as TV picker */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {WORKER_CLASSES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCls(c.id)}
            className={cn(
              "card-soft flex flex-col items-center gap-2 p-2.5 transition-transform",
              cls === c.id ? "ring-2 ring-ink -translate-y-0.5" : "hover:-translate-y-0.5"
            )}
          >
            <TvArt src={CLASS_ART[c.id]} size={76} />
            <span className="display text-xs">{c.label}</span>
            <span className="text-[0.65rem] text-ink-soft">×{c.modifier}</span>
          </button>
        ))}
      </div>

      {/* market */}
      <div className="flex flex-wrap justify-center gap-2">
        {MARKET_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setAsset(null);
            }}
            className={cn("chip", category === cat && "bg-ink text-screen")}
          >
            {cat}
          </button>
        ))}
      </div>
      {category && (
        <div className="flex flex-wrap justify-center gap-2">
          {assetsByCategory(category).map((a) => (
            <button
              key={a.symbol}
              onClick={() => setAsset(a.symbol)}
              className={cn("chip tnum", asset === a.symbol && "bg-ink text-screen")}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      )}

      <Button
        variant="pink"
        className="w-full"
        disabled={!ready}
        onClick={() => ready && t.createWorker({ name, cls: cls!, category: category!, asset: asset! })}
      >
        Register worker
      </Button>
      <p className="text-center text-xs text-ink-soft">
        Class and market lock in once deployed.
      </p>
    </div>
  );
}

function WorkerCard() {
  const t = useTerminal();
  const w = t.worker!;
  const cls = WORKER_CLASSES.find((c) => c.id === w.class)!;
  const market = MARKETS.find((m) => m.symbol === w.asset);
  const active = w.status === "active";
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <TvArt src={CLASS_ART[w.class]} size={168} />
      <div className="mt-4 flex items-center gap-2">
        <h2 className="display text-2xl">{w.name}</h2>
        <StatusDot tone={active ? "live" : "idle"} />
      </div>
      <div className="mt-0.5 text-sm text-ink-soft">
        {cls.label} · watching {w.asset}
        {market && (
          <span className={market.change >= 0 ? "text-up" : "text-down"}> {pct(market.change)}</span>
        )}
      </div>

      <div className="mt-5 grid w-full grid-cols-3 gap-3">
        <Stat label="On duty" value={w.deployedAt ? duration(Date.now() - w.deployedAt) : "—"} />
        <Stat label="Boost" value={`×${cls.modifier}`} />
        <Stat label="Bloom" value={fmt(w.baseEarned)} accent />
      </div>

      <div className="mt-5 flex gap-3">
        {w.status === "ready" && (
          <Button variant="green" onClick={t.deployWorker}>
            <Rocket size={16} /> Deploy
          </Button>
        )}
        {active && (
          <Button onClick={t.pauseWorker}>
            <Pause size={16} /> Pause
          </Button>
        )}
        {w.status === "paused" && (
          <Button variant="green" onClick={t.resumeWorker}>
            <Play size={16} /> Resume
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-soft py-3">
      <div className="pixel text-[0.55rem] text-ink-soft">{label.toUpperCase()}</div>
      <div className={cn("display mt-1 text-lg tnum", accent && "text-green")}>{value}</div>
    </div>
  );
}

/* --------------------------------------------------------------- Missions */

function MissionsTab() {
  const t = useTerminal();
  const done = t.missions.filter((m) => m.done).length;
  const progress = (done / t.missions.length) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="display text-sm">Missions</span>
          <span className="pixel text-[0.6rem] text-ink-soft">
            {done}/{t.missions.length}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="space-y-2.5">
        {t.missions.map((m) => (
          <div key={m.id} className="card-soft flex items-center gap-3 p-3">
            <span
              className={cn(
                "grid h-7 w-7 flex-none place-items-center rounded-full border-2 border-ink",
                m.done ? "bg-green text-white" : "bg-screen"
              )}
            >
              {m.done ? <Check size={14} /> : ""}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{m.title}</div>
              <div className="truncate text-xs text-ink-soft">{m.description}</div>
            </div>
            {m.done ? (
              <Badge variant="green">done</Badge>
            ) : m.id === "bind-wallet" ? (
              <Button size="sm" variant="blue" onClick={t.connectWallet}>
                Bind
              </Button>
            ) : m.id === "invite-agents" ? (
              <Badge variant="muted">agents →</Badge>
            ) : (
              <Button size="sm" onClick={() => t.completeMission(m.id)}>
                Verify
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Agents */

const AGENT_LABEL: Record<AgentStatus, string> = {
  invited: "invited",
  connected: "connected",
  wallet_pending: "needs wallet",
  active: "active",
  eligible: "eligible",
};

function AgentsTab() {
  const t = useTerminal();
  const [copied, setCopied] = useState(false);
  const link = `${BRAND.joinBase}/${(t.handle ?? "you").toUpperCase()}`;

  function copy() {
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="display text-xl">Deploy {ECONOMY.requiredAgents} agents</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Invite friends. They count once they are eligible.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border-2 border-ink bg-screen-2 px-3 py-2 text-sm">
          {link}
        </code>
        <Button size="sm" onClick={copy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </Button>
      </div>

      <Button variant="pink" className="w-full" onClick={t.inviteAgent}>
        <UserPlus size={16} /> Invite an agent
      </Button>

      <div className="space-y-2">
        {t.agents.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">No agents yet.</p>
        ) : (
          t.agents.map((a) => {
            const settled = a.status === "active" || a.status === "eligible";
            return (
              <div key={a.id} className="card-soft flex items-center gap-3 p-2.5">
                <StatusDot tone={settled ? "live" : a.status === "wallet_pending" ? "warn" : "idle"} />
                <span className="flex-1 font-bold">@{a.handle}</span>
                <Badge variant={settled ? "green" : "muted"}>{AGENT_LABEL[a.status]}</Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Rewards */

function RewardsTab() {
  const t = useTerminal();
  return (
    <div className="space-y-4">
      <Panel className="text-center">
        <div className="pixel text-[0.6rem] text-ink-soft">
          {t.nftMinted ? "CLAIMABLE" : "EARNED · LOCKED"}
        </div>
        <div className="display mt-1 text-5xl tnum text-green">{fmt(t.displayBalance)}</div>
        <div className="mt-1 text-xs text-ink-soft">
          base {fmt(t.baseBalance)} · ×{t.multiplier.toFixed(2)}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel soft title="Bloom NFT">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-soft">Multiplier</span>
            <span className="display tnum">×{(t.nftMinted ? ECONOMY.nftMultiplier : 1).toFixed(2)}</span>
          </div>
          {!t.nftMinted ? (
            <Button variant="yellow" className="mt-3 w-full" onClick={t.mint}>
              <Sparkles size={16} /> Mint
            </Button>
          ) : (
            <Badge variant="green" className="mt-3">minted</Badge>
          )}
        </Panel>

        <Panel soft title="Claim">
          {t.nftMinted ? (
            <>
              <div className="text-sm text-ink-soft">Ready</div>
              <div className="display text-2xl tnum">{fmt(t.claimable)}</div>
              <Button variant="green" className="mt-2 w-full" disabled={t.claimable <= 0} onClick={t.claim}>
                <Coins size={16} /> Claim
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <Badge variant="yellow">
                <Lock size={11} /> locked
              </Badge>
              <p className="text-xs text-ink-soft">Mint the NFT to unlock claims.</p>
            </div>
          )}
        </Panel>
      </div>
      <p className="text-center text-xs text-ink-soft">
        Demo rates — final emissions set separately.
      </p>
    </div>
  );
}
