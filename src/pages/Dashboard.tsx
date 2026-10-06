import { Link } from "react-router-dom";
import { Wallet, ArrowUpRight } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/StatusDot";
import { MarketTable, Movers } from "@/components/terminal/MarketTable";
import { EligibilityChecklist } from "@/components/terminal/Eligibility";
import { useTerminal } from "@/state/terminal";
import { WORKER_CLASSES } from "@/lib/mock";
import { fmt, duration } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const t = useTerminal();

  return (
    <div className="space-y-5">
      {/* heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-semibold tracking-wide">
            Terminal<span className="text-muted-foreground"> / overview</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, @{t.handle}. Here's your terminal at a glance.
          </p>
        </div>
        {!t.walletConnected && (
          <Button onClick={t.connectWallet} variant="accent" size="sm">
            <Wallet size={15} /> Connect wallet
          </Button>
        )}
      </div>

      {/* eligibility banner */}
      {!t.eligible && (
        <Panel className="border-accent/30 bg-accent/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <StatusDot tone="warn" />
              <span className="font-mono uppercase tracking-wider text-accent">
                Terminal locked
              </span>
              <span className="text-muted-foreground">
                — complete the requirements to unlock your workforce.
              </span>
            </div>
            <Link to="/terminal/missions">
              <Button size="sm" variant="outline">
                View missions <ArrowUpRight size={14} />
              </Button>
            </Link>
          </div>
        </Panel>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* status */}
        <Panel title="Terminal status" action={<StatusDot tone="live" />}>
          <EligibilityChecklist />
          <div className="mt-4 border-t border-border pt-3">
            {t.eligible ? (
              <Badge variant="up">✓ Eligible — workforce unlocked</Badge>
            ) : (
              <Badge variant="muted">Awaiting requirements</Badge>
            )}
          </div>
        </Panel>

        {/* worker */}
        <WorkerPanel />

        {/* rewards */}
        <Panel title="Rewards">
          <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
            Available
          </div>
          <div className="text-3xl font-semibold text-primary tnum">
            {fmt(t.displayBalance)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                Multiplier
              </div>
              <div className="tnum">×{t.multiplier.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                Status
              </div>
              <div className="font-mono text-xs uppercase">{t.rewardState}</div>
            </div>
          </div>
          <Link to="/terminal/rewards" className="mt-4 block">
            <Button variant="outline" size="sm" className="w-full">
              Open rewards
            </Button>
          </Link>
        </Panel>

        {/* markets */}
        <Panel
          title="Tokenized markets"
          action={<span className="font-mono text-[0.62rem] text-muted-foreground">LIVE · demo</span>}
          className="md:col-span-2"
        >
          <MarketTable />
        </Panel>

        {/* movers */}
        <Panel title="Top movers">
          <Movers />
        </Panel>
      </div>
    </div>
  );
}

function WorkerPanel() {
  const t = useTerminal();
  const [, force] = useState(0);
  // keep the deployment timer ticking
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!t.worker) {
    return (
      <Panel title="Worker">
        <div className="flex h-full flex-col items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            No worker yet. Unlock your workforce and deploy your first worker to
            start generating Bloom.
          </p>
          <Link to="/terminal/workforce">
            <Button size="sm" variant={t.eligible ? "primary" : "outline"} disabled={!t.eligible}>
              {t.eligible ? "Create worker" : "Locked"}
            </Button>
          </Link>
        </div>
      </Panel>
    );
  }

  const cls = WORKER_CLASSES.find((c) => c.id === t.worker!.class);
  const active = t.worker.status === "active";
  return (
    <Panel
      title="Worker"
      action={<StatusDot tone={active ? "live" : "idle"} />}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-lg font-semibold">{t.worker.name}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {cls?.label} · {t.worker.asset}
          </div>
        </div>
        <Badge variant={active ? "up" : "muted"}>{t.worker.status}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
            Deployed
          </div>
          <div className="tnum">
            {t.worker.deployedAt ? duration(Date.now() - t.worker.deployedAt) : "—"}
          </div>
        </div>
        <div>
          <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
            Output
          </div>
          <div className="tnum text-primary">{fmt(t.worker.baseEarned)}</div>
        </div>
      </div>
    </Panel>
  );
}
