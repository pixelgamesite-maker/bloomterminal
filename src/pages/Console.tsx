import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Lock, ExternalLink, Pause, Play, RotateCw } from "lucide-react";
import { useTerminal } from "@/state/terminal";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Menu } from "@/components/Menu";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { TvArt } from "@/components/TvArt";
import { BindWalletModal } from "@/components/BindWalletModal";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusDot } from "@/components/StatusDot";
import { WORKER_CLASSES, MARKET_KINDS, assetsForKind } from "@/lib/catalog";
import { CLASS_ART, LOGO } from "@/lib/art";
import { ECONOMY, BRAND } from "@/lib/config";
import { getRef } from "@/lib/referral";
import type { MarketKind, WorkerClass } from "@/lib/types";
import { cn, duration } from "@/lib/utils";

type Tab = "agent" | "tasks" | "invites" | "rewards";

const TABS: { id: Tab; label: string }[] = [
  { id: "agent", label: "Agent" },
  { id: "tasks", label: "Tasks" },
  { id: "invites", label: "Invites" },
  { id: "rewards", label: "Rewards" },
];

export default function Console() {
  const [tab, setTab] = useState<Tab>("agent");
  const [soon, setSoon] = useState<{ title: string; blurb: string; art: string } | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Menu onComingSoon={(title, blurb, art) => setSoon({ title, blurb, art })} />
          <Link to="/" className="flex items-center gap-2">
            <img src={LOGO} className="pixel h-7 w-7 rounded-md" alt="" />
            <span className="pixel text-xs">BLOOM</span>
          </Link>
        </div>
        <ProfileMenu />
      </div>
      {soon && (
        <ComingSoonModal title={soon.title} blurb={soon.blurb} art={soon.art} onClose={() => setSoon(null)} />
      )}

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
        {tab === "agent" && <AgentTab setTab={setTab} />}
        {tab === "tasks" && <TasksTab setTab={setTab} />}
        {tab === "invites" && <InvitesTab />}
        {tab === "rewards" && <RewardsTab />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Agent hub */

function AgentTab({ setTab }: { setTab: (t: Tab) => void }) {
  const t = useTerminal();
  if (t.worker) return <WorkerCard />;
  return <AgentHub setTab={setTab} />;
}

function AgentHub({ setTab }: { setTab: (t: Tab) => void }) {
  const t = useTerminal();
  const [step, setStep] = useState<"pick" | "market">("pick");
  const [cls, setCls] = useState<WorkerClass | null>(null);
  const [kind, setKind] = useState<MarketKind | null>(null);
  const [asset, setAsset] = useState<string | null>(null);

  const selected = WORKER_CLASSES.find((c) => c.id === cls);

  function confirm() {
    if (!cls || !kind || !asset) return;
    t.createWorker({ cls, kind, asset });
    setTab("tasks"); // once picked, go do the tasks
  }

  if (step === "market") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h2 className="display text-2xl">What are you into?</h2>
          <p className="mt-1 text-sm text-ink-soft">Your {selected?.label} will watch this market.</p>
        </div>

        <div className="flex justify-center gap-3">
          {MARKET_KINDS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setKind(m.id);
                setAsset(null);
              }}
              className={cn(
                "btn",
                kind === m.id ? (m.id === "CRYPTO" ? "btn-yellow" : "btn-blue") : "",
                "h-12 px-8"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {kind && (
          <div className="flex flex-wrap justify-center gap-2">
            {assetsForKind(kind).map((a) => (
              <button
                key={a.symbol}
                onClick={() => setAsset(a.symbol)}
                className={cn("chip tnum", asset === a.symbol && "bg-ink text-screen")}
                title={a.name}
              >
                {a.symbol}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button onClick={() => setStep("pick")}>Back</Button>
          <Button variant="pink" disabled={!asset} onClick={confirm}>
            Confirm agent
          </Button>
        </div>
        <p className="text-center text-xs text-ink-soft">
          <Lock size={11} className="mb-0.5 inline" /> This is a one-time choice, your agent and
          market lock after this.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="display text-2xl">Pick your agent</h2>
        <p className="mt-1 text-sm text-ink-soft">Choose one. It's yours for good.</p>
      </div>

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
            <TvArt src={CLASS_ART[c.id]} size={80} />
            <span className="display text-center text-xs leading-tight">{c.label}</span>
          </button>
        ))}
      </div>

      {/* stats of the selected agent */}
      {selected && (
        <Panel soft>
          <div className="flex items-start gap-3">
            <TvArt src={CLASS_ART[selected.id]} size={64} />
            <div className="min-w-0">
              <div className="display text-lg">{selected.label}</div>
              <div className="text-sm text-ink-soft">{selected.spec}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="green">Boost ×{selected.modifier}</Badge>
                {selected.focus.map((f) => (
                  <Badge key={f} variant="muted">{f}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}

      <Button variant="pink" className="w-full" disabled={!cls} onClick={() => setStep("market")}>
        Next
      </Button>
    </div>
  );
}

function WorkerCard() {
  const t = useTerminal();
  const w = t.worker!;
  const cls = WORKER_CLASSES.find((c) => c.id === w.class)!;
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
        <h2 className="display text-2xl">{cls.label}</h2>
        <StatusDot tone={active ? "live" : "idle"} />
      </div>
      <div className="mt-0.5 text-sm text-ink-soft">
        watching {w.asset}
        {" · "}
        <span className="inline-flex items-center gap-1">
          <Lock size={11} /> locked
        </span>
      </div>

      <div className="mt-5 grid w-full grid-cols-2 gap-3">
        <Stat label="On duty" value={w.deployedAt ? duration(Date.now() - w.deployedAt) : "-"} />
        <Stat label="Boost" value={`×${cls.modifier}`} />
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Earning Bloom while active · rewards engine coming soon
      </p>

      <div className="mt-5">
        {active ? (
          <Button onClick={t.pauseWorker}>
            <Pause size={16} /> Pause
          </Button>
        ) : (
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

/* ----------------------------------------------------------------- Tasks */

function TasksTab({ setTab }: { setTab: (t: Tab) => void }) {
  const t = useTerminal();
  const [binding, setBinding] = useState(false);
  const done = t.missions.filter((m) => m.done).length;
  const progress = (done / t.missions.length) * 100;
  const short = t.address ? `${t.address.slice(0, 6)}…${t.address.slice(-4)}` : null;
  // Wallet bind is the final step: locked until every other task is done.
  const othersDone = t.missions.filter((m) => m.id !== "bind-wallet").every((m) => m.done);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="display text-sm">Tasks · one-time</span>
          <span className="pixel text-[0.6rem] text-ink-soft">{done}/{t.missions.length}</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="space-y-2.5">
        {t.missions.map((m) => {
          // Quote + comment require the user to submit their post link.
          if ((m.id === "quote" || m.id === "comment") && !m.done) {
            return <SubmitRow key={m.id} m={m} />;
          }
          return (
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
                <div className="truncate text-xs text-ink-soft">
                  {m.id === "bind-wallet" && m.done && short ? (
                    <span className="font-mono">{short}</span>
                  ) : m.id === "bind-wallet" && !othersDone ? (
                    "Unlocks once your other tasks are done"
                  ) : m.done && t.taskLinks[m.id] ? (
                    <a href={t.taskLinks[m.id]} target="_blank" rel="noreferrer noopener" className="truncate underline">
                      {t.taskLinks[m.id]}
                    </a>
                  ) : (
                    m.description
                  )}
                </div>
              </div>
              {m.done ? (
                <Badge variant="green">done</Badge>
              ) : m.id === "bind-wallet" ? (
                othersDone ? (
                  <Button size="sm" variant="blue" onClick={() => setBinding(true)}>
                    Bind
                  </Button>
                ) : (
                  <Button size="sm" disabled title="Finish the other tasks first">
                    <Lock size={13} /> Locked
                  </Button>
                )
              ) : m.id === "invite-agents" ? (
                <Button size="sm" onClick={() => setTab("invites")}>
                  Invite
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    if (m.link) window.open(m.link, "_blank", "noopener");
                    t.completeMission(m.id);
                  }}
                >
                  {m.external && <ExternalLink size={13} />} Verify
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {binding && <BindWalletModal onClose={() => setBinding(false)} />}
    </div>
  );
}

function SubmitRow({ m }: { m: { id: string; title: string; description: string; link?: string } }) {
  const t = useTerminal();
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setErr(null);
    const res = await t.submitTaskLink(m.id, url);
    setBusy(false);
    if (!res.ok) setErr(res.error ?? "Invalid link.");
  }

  return (
    <div className="card-soft p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-full border-2 border-ink bg-screen" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{m.title}</div>
          <div className="truncate text-xs text-ink-soft">{m.description}</div>
        </div>
        {m.link && (
          <a
            href={m.link}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1 rounded-lg border-2 border-ink bg-screen px-2.5 py-1.5 text-xs font-bold hover:bg-ink hover:text-screen"
          >
            <ExternalLink size={13} /> Open
          </a>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 pl-10">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste your post link"
          className="w-full rounded-lg border-2 border-ink bg-screen px-3 py-1.5 text-xs font-semibold outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-pink"
        />
        <Button size="sm" variant="blue" disabled={busy || !url.trim()} onClick={submit}>
          Submit
        </Button>
      </div>
      {err && <p className="mt-1 pl-10 text-xs text-red">{err}</p>}
    </div>
  );
}

/* --------------------------------------------------------------- Invites */

function InvitesTab() {
  const t = useTerminal();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const code = (t.handle ?? "you").toUpperCase();
  const link = `${BRAND.joinBase}/${code}`;

  // Pull the latest referred-friends list when the tab opens.
  useEffect(() => {
    t.refreshInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copy(which: "code" | "link") {
    navigator.clipboard?.writeText(which === "code" ? code : link).catch(() => {});
    setCopied(which);
    setTimeout(() => setCopied(null), 1400);
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="display text-xl">Invite {ECONOMY.requiredAgents} friends</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Share your code. A friend counts the moment they enter it, no wallet needed.
        </p>
      </div>

      {/* were you invited? enter a code (the reliable path) */}
      <ReferredByCard />

      {/* your code to share */}
      <div className="card-soft p-3">
        <div className="pixel text-[0.55rem] text-ink-soft">YOUR CODE</div>
        <div className="mt-1 flex items-center gap-2">
          <code className="display flex-1 truncate rounded-lg border-2 border-ink bg-screen px-3 py-2 text-base">
            {code}
          </code>
          <Button size="sm" onClick={() => copy("code")}>
            {copied === "code" ? <Check size={15} /> : <Copy size={15} />}
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border-2 border-ink bg-screen-2 px-3 py-1.5 text-xs text-ink-soft">
            {link}
          </code>
          <Button size="sm" onClick={() => copy("link")}>
            {copied === "link" ? <Check size={15} /> : <Copy size={15} />}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="pixel text-[0.6rem] text-ink-soft">
          {t.activeAgents}/{ECONOMY.requiredAgents} active
        </span>
        <Button size="sm" onClick={t.refreshInvites}>
          <RotateCw size={14} /> Refresh
        </Button>
      </div>
      <div className="space-y-2">
        {t.invites.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">
            No one has joined with your link yet.
          </p>
        ) : (
          t.invites.map((i, idx) => (
            <div key={idx} className="card-soft flex items-center gap-3 p-2.5">
              <StatusDot tone="live" />
              <span className="flex-1 font-bold">@{i.handle}</span>
              <Badge variant={i.walletVerified ? "green" : "blue"}>
                {i.walletVerified ? "wallet set" : "counted"}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ReferredByCard() {
  const t = useTerminal();
  const [code, setCode] = useState(() => getRef() ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (t.referredBy) {
    return (
      <div className="card-soft flex items-center gap-2 p-3">
        <StatusDot tone="live" />
        <span className="text-sm">
          Invited by <span className="font-bold">@{t.referredBy}</span>
        </span>
        <Badge variant="green" className="ml-auto">linked</Badge>
      </div>
    );
  }

  async function apply() {
    setBusy(true);
    setMsg(null);
    const res = await t.applyReferralCode(code);
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "Linked to your inviter ✓" } : { ok: false, text: res.error ?? "Couldn't apply that code." });
  }

  return (
    <div className="card-soft p-3">
      <div className="pixel text-[0.55rem] text-ink-soft">INVITED BY SOMEONE?</div>
      <div className="mt-1 flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter their code"
          className="w-full rounded-lg border-2 border-ink bg-screen px-3 py-2 text-sm font-semibold uppercase outline-none placeholder:normal-case placeholder:text-ink-soft focus:ring-2 focus:ring-pink"
        />
        <Button size="sm" variant="pink" disabled={busy || !code.trim()} onClick={apply}>
          Apply
        </Button>
      </div>
      {msg && <p className={cn("mt-1.5 text-xs", msg.ok ? "text-green" : "text-red")}>{msg.text}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- Rewards */

function RewardsTab() {
  return (
    <div className="space-y-4">
      <Panel className="text-center">
        <div className="pixel text-[0.6rem] text-ink-soft">BLOOM</div>
        <div className="display mt-2 text-2xl">Accruing while your agent works</div>
        <div className="mt-1 text-xs text-ink-soft">
          The rewards engine goes live soon, balances will appear here then.
        </div>
      </Panel>

      <Panel soft title="Bloom NFT">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">The multiplier mint</div>
            <div className="text-sm text-ink-soft">Mint to boost every agent's output.</div>
          </div>
          <Badge variant="yellow">Coming soon</Badge>
        </div>
        <Button className="mt-3 w-full" disabled>
          Minting opens soon
        </Button>
      </Panel>
    </div>
  );
}
