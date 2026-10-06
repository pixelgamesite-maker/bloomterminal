import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/StatusDot";
import { MarketTable, Movers } from "@/components/terminal/MarketTable";
import { EligibilityChecklist } from "@/components/terminal/Eligibility";
import { useTerminal } from "@/state/terminal";
import { WORKER_CLASSES } from "@/lib/mock";
import { fmt, duration } from "@/lib/utils";

export default function Dashboard() {
  const t = useTerminal();

  return (
    <div className="space-y-6">
      {/* front-page lead */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule-strong pb-3">
        <div>
          <p className="kicker">From the desk of @{t.handle}</p>
          <h2 className="headline mt-1 text-4xl sm:text-5xl">
            {t.eligible ? "Your Terminal Is Open for Business" : "Your Terminal Awaits Clearance"}
          </h2>
        </div>
        {!t.walletConnected && (
          <Button onClick={t.connectWallet} variant="claret" size="sm">
            Bind wallet
          </Button>
        )}
      </div>

      {!t.eligible && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-claret bg-paper-2 px-4 py-3">
          <p className="justify text-[0.98rem]">
            <span className="kicker mr-2">Notice</span>
            The workforce desk is sealed until every requirement below is met.
          </p>
          <Link to="/terminal/missions">
            <Button size="sm" variant="outline">
              Read the application
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* main column: markets */}
        <section>
          <Panel title="Tokenized Markets — Last & Change">
            <MarketTable />
          </Panel>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Panel title="The Reader's Standing" action={<StatusDot tone="live" />}>
              <EligibilityChecklist />
              <div className="mt-3 border-t border-rule pt-3">
                {t.eligible ? (
                  <span className="seal text-xs">Eligible · Workforce Unlocked</span>
                ) : (
                  <span className="italic text-ink-soft">Awaiting requirements…</span>
                )}
              </div>
            </Panel>

            <WorkerPanel />
          </div>
        </section>

        {/* sidebar */}
        <aside className="space-y-6">
          <Panel title="Today's Movers">
            <Movers />
          </Panel>

          <Panel title="Bloom on the Books">
            <div className="text-center">
              <div className="headline text-5xl tnum">{fmt(t.displayBalance)}</div>
              <div className="folio mt-1">
                ×{t.multiplier.toFixed(2)} multiplier · {t.rewardState}
              </div>
            </div>
            <Link to="/terminal/rewards" className="mt-4 block">
              <Button variant="outline" size="sm" className="w-full">
                To the markets desk
              </Button>
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function WorkerPanel() {
  const t = useTerminal();
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!t.worker) {
    return (
      <Panel title="The Workforce">
        <div className="flex h-full flex-col items-start justify-between gap-4">
          <p className="justify text-[0.98rem] text-ink-soft">
            No worker commissioned. Clear the desk, then name and deploy your
            first worker to begin earning Bloom.
          </p>
          <Link to="/terminal/workforce">
            <Button size="sm" variant={t.eligible ? "primary" : "outline"} disabled={!t.eligible}>
              {t.eligible ? "Commission a worker" : "Sealed"}
            </Button>
          </Link>
        </div>
      </Panel>
    );
  }

  const cls = WORKER_CLASSES.find((c) => c.id === t.worker!.class);
  const active = t.worker.status === "active";
  return (
    <Panel title="The Workforce" action={<StatusDot tone={active ? "live" : "idle"} />}>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="headline text-2xl">{t.worker.name}</div>
          <div className="text-sm italic text-ink-soft">
            {cls?.label} · {t.worker.asset}
          </div>
        </div>
        <Badge variant={active ? "up" : "muted"}>{t.worker.status}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Figure label="On post" value={t.worker.deployedAt ? duration(Date.now() - t.worker.deployedAt) : "—"} />
        <Figure label="Output" value={fmt(t.worker.baseEarned)} />
      </div>
    </Panel>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="folio">{label}</div>
      <div className="headline text-xl tnum">{value}</div>
    </div>
  );
}
