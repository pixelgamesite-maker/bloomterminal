import { useEffect, useState } from "react";
import { AlertTriangle, Pause, Play, Rocket } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/StatusDot";
import { useTerminal } from "@/state/terminal";
import { WORKER_CLASSES, MARKET_CATEGORIES, assetsByCategory } from "@/lib/mock";
import type { WorkerClass } from "@/lib/types";
import { cn, fmt, duration } from "@/lib/utils";

export default function Workforce() {
  const t = useTerminal();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-semibold tracking-wide">
          Workforce<span className="text-muted-foreground"> / workers</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a worker, assign it a market, and deploy it to generate Bloom.
        </p>
      </div>
      {t.worker ? <ManageWorker /> : <CreateWorker />}
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
      {/* name */}
      <Panel title="01 · Name your worker">
        <div className="flex h-11 items-center rounded-md border border-border bg-background px-3 font-mono focus-within:border-primary/50">
          <span className="text-muted-foreground">&gt;</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="ORION"
            className="ml-2 w-full bg-transparent uppercase tracking-wider outline-none placeholder:text-muted-foreground/40"
          />
        </div>
      </Panel>

      {/* class */}
      <Panel title="02 · Choose a class">
        <div className="grid gap-3 sm:grid-cols-2">
          {WORKER_CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCls(c.id)}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                cls === c.id
                  ? "border-primary bg-primary/[0.07]"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold uppercase tracking-wider">
                  {c.label}
                </span>
                <span className="font-mono text-xs text-primary tnum">×{c.modifier}</span>
              </div>
              <div className="mt-0.5 text-xs italic text-muted-foreground">"{c.identity}"</div>
              <p className="mt-2 text-sm text-muted-foreground">{c.purpose}</p>
            </button>
          ))}
        </div>
      </Panel>

      {/* market */}
      <Panel title="03 · Select a market">
        <div className="flex flex-wrap gap-2">
          {MARKET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setAsset(null);
              }}
              className={cn(
                "rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                category === cat
                  ? "border-primary bg-primary/[0.07] text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {category && (
          <div className="mt-4 border-t border-border pt-3">
            {assetsByCategory(category).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tokenized assets listed in {category} yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assetsByCategory(category).map((a) => (
                  <button
                    key={a.symbol}
                    onClick={() => setAsset(a.symbol)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 font-mono text-sm transition-colors",
                      asset === a.symbol
                        ? "border-primary bg-primary/[0.07] text-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {a.symbol}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* confirm */}
      <Panel title="04 · Confirm" className={cn(ready ? "border-primary/30" : "")}>
        <div className="flex items-start gap-2 rounded-md border border-accent/30 bg-accent/[0.05] p-3 text-sm">
          <AlertTriangle size={16} className="mt-0.5 flex-none text-accent" />
          <span className="text-muted-foreground">
            Worker <span className="text-foreground">class</span> and{" "}
            <span className="text-foreground">primary market</span> are permanent
            after deployment.
          </span>
        </div>
        <Button
          className="mt-4 w-full"
          disabled={!ready}
          onClick={() =>
            ready &&
            t.createWorker({ name, cls: cls!, category: category!, asset: asset! })
          }
        >
          Confirm configuration
        </Button>
      </Panel>
    </div>
  );
}

function ManageWorker() {
  const t = useTerminal();
  const w = t.worker!;
  const cls = WORKER_CLASSES.find((c) => c.id === w.class);
  const active = w.status === "active";
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <Panel
      title="Deployed worker"
      action={<StatusDot tone={active ? "live" : "idle"} />}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-2xl font-semibold">{w.name}</div>
          <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
            {cls?.label} · {w.category} · {w.asset}
          </div>
        </div>
        <Badge variant={active ? "up" : w.status === "paused" ? "accent" : "muted"}>
          {w.status}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Deployed" value={w.deployedAt ? duration(Date.now() - w.deployedAt) : "—"} />
        <Stat label="Class modifier" value={`×${cls?.modifier.toFixed(2)}`} />
        <Stat label="Bloom output" value={fmt(w.baseEarned)} accent />
      </div>

      <div className="mt-5 flex gap-3 border-t border-border pt-4">
        {w.status === "ready" && (
          <Button onClick={t.deployWorker}>
            <Rocket size={15} /> Deploy worker
          </Button>
        )}
        {active && (
          <Button variant="outline" onClick={t.pauseWorker}>
            <Pause size={15} /> Pause
          </Button>
        )}
        {w.status === "paused" && (
          <Button onClick={t.resumeWorker}>
            <Play size={15} /> Resume
          </Button>
        )}
      </div>
    </Panel>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("tnum text-lg", accent && "text-primary")}>{value}</div>
    </div>
  );
}
