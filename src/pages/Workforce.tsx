import { useEffect, useState } from "react";
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
    <div className="space-y-6">
      <header className="border-b border-rule-strong pb-3">
        <p className="kicker">Industry &amp; Labour</p>
        <h2 className="headline mt-1 text-4xl sm:text-5xl">Commission a Worker</h2>
        <p className="subhead mt-2 text-lg">
          Name a worker, assign its class and market, and send it to post to
          begin earning Bloom.
        </p>
      </header>
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
    <div className="space-y-6">
      <Panel title="I · The Name">
        <div className="flex h-12 items-center border-2 border-rule-strong bg-paper-2 px-3 font-head">
          <span className="text-ink-soft">&gt;</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="ORION"
            className="ml-2 w-full bg-transparent text-lg uppercase tracking-wide outline-none placeholder:text-ink-faint"
          />
        </div>
      </Panel>

      <Panel title="II · The Class">
        <div className="grid gap-4 sm:grid-cols-2">
          {WORKER_CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCls(c.id)}
              className={cn(
                "border p-4 text-left transition-colors",
                cls === c.id ? "border-rule-strong bg-paper-2" : "border-rule hover:border-rule-strong"
              )}
            >
              <div className="flex items-baseline justify-between">
                <span className="headline text-2xl">{c.label}</span>
                <span className="font-head text-sm tnum text-ink-soft">×{c.modifier}</span>
              </div>
              <div className="mt-0.5 text-sm italic text-claret">&ldquo;{c.identity}&rdquo;</div>
              <p className="mt-2 text-[0.95rem] text-ink-soft">{c.purpose}</p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="III · The Market">
        <div className="flex flex-wrap gap-2">
          {MARKET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setAsset(null);
              }}
              className={cn(
                "border px-3 py-1.5 font-head text-sm font-semibold tracking-wide transition-colors",
                category === cat
                  ? "border-rule-strong bg-ink text-paper"
                  : "border-rule hover:border-rule-strong"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {category && (
          <div className="mt-4 border-t border-rule pt-3">
            {assetsByCategory(category).length === 0 ? (
              <p className="italic text-ink-soft">No tokenized issues listed in {category} yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assetsByCategory(category).map((a) => (
                  <button
                    key={a.symbol}
                    onClick={() => setAsset(a.symbol)}
                    className={cn(
                      "border px-3 py-1.5 font-head font-semibold tnum transition-colors",
                      asset === a.symbol
                        ? "border-rule-strong bg-ink text-paper"
                        : "border-rule hover:border-rule-strong"
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

      <Panel title="IV · The Commission">
        <div className="border border-claret bg-paper-2 p-3 text-[0.98rem]">
          <span className="kicker mr-2">Caution</span>
          A worker&rsquo;s <em>class</em> and <em>primary market</em> are struck
          permanently once deployed.
        </div>
        <Button
          className="mt-4 w-full h-12"
          disabled={!ready}
          onClick={() => ready && t.createWorker({ name, cls: cls!, category: category!, asset: asset! })}
        >
          Confirm the commission
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
    <Panel title="Worker on the Books" action={<StatusDot tone={active ? "live" : "idle"} />}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="headline text-4xl">{w.name}</div>
          <div className="mt-0.5 text-sm italic text-ink-soft">
            {cls?.label} · {w.category} · {w.asset}
          </div>
        </div>
        <Badge variant={active ? "up" : w.status === "paused" ? "claret" : "muted"}>{w.status}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-rule pt-4 sm:grid-cols-3">
        <Stat label="On post" value={w.deployedAt ? duration(Date.now() - w.deployedAt) : "—"} />
        <Stat label="Class modifier" value={`×${cls?.modifier.toFixed(2)}`} />
        <Stat label="Bloom output" value={fmt(w.baseEarned)} />
      </div>

      <div className="mt-5 flex gap-3 border-t border-rule pt-4">
        {w.status === "ready" && <Button onClick={t.deployWorker}>Send to post</Button>}
        {active && (
          <Button variant="outline" onClick={t.pauseWorker}>
            Recall
          </Button>
        )}
        {w.status === "paused" && <Button onClick={t.resumeWorker}>Return to post</Button>}
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="folio">{label}</div>
      <div className="headline text-xl tnum">{value}</div>
    </div>
  );
}
