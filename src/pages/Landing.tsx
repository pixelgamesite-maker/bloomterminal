import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/StatusDot";
import { useTerminal } from "@/state/terminal";
import { BRAND } from "@/lib/config";

export default function Landing() {
  const navigate = useNavigate();
  const { connectX } = useTerminal();
  const [handle, setHandle] = useState("");

  function enter() {
    connectX(handle);
    navigate("/terminal");
  }

  return (
    <div className="bloom-grid-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        {/* top bar */}
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold tracking-widest">
            <span className="text-primary">◆</span> BLOOM<span className="text-muted-foreground">TERMINAL</span>
          </div>
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <StatusDot tone="live" /> SYSTEM ONLINE
          </span>
        </header>

        {/* hero */}
        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              <StatusDot tone="warn" /> Whitelist · Pre-mint
            </div>
            <h1 className="font-mono text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Access the <span className="text-primary">market.</span>
              <span className="cursor" />
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              {BRAND.tagline} An onchain market-intelligence terminal where you
              deploy autonomous workers to monitor tokenized markets and earn
              Bloom.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-12 items-center rounded-md border border-border bg-panel px-3 font-mono text-sm focus-within:border-primary/50">
                <span className="text-muted-foreground">@</span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enter()}
                  placeholder="your_handle"
                  className="w-40 bg-transparent px-1 outline-none placeholder:text-muted-foreground/50"
                  aria-label="X handle"
                />
              </div>
              <Button size="lg" onClick={enter}>
                Enter Terminal <ArrowRight size={16} />
              </Button>
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Demo build · sign-in is simulated, no real X/wallet calls yet.
            </p>
          </div>

          {/* mini terminal preview */}
          <Panel
            title="bloom://preview"
            action={<StatusDot tone="live" />}
            className="scanlines overflow-hidden"
            bodyClassName="font-mono text-sm space-y-1.5"
          >
            <Line k="user" v="@operator" />
            <Line k="x account" v="✓ connected" tone="up" />
            <Line k="wallet" v="✓ connected" tone="up" />
            <Line k="agents" v="2 / 2" />
            <Line k="eligibility" v="✓ confirmed" tone="up" />
            <div className="my-2 border-t border-border" />
            <Line k="worker" v="ORION · SCOUT" />
            <Line k="status" v="● active" tone="up" />
            <div className="pt-2">
              <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                Bloom balance
              </div>
              <div className="text-2xl font-semibold text-primary tnum">2,481.32</div>
            </div>
          </Panel>
        </main>

        <footer className="py-6 font-mono text-xs text-muted-foreground">
          Build your terminal · Choose your agent · Put it to work · Watch it bloom
        </footer>
      </div>
    </div>
  );
}

function Line({ k, v, tone }: { k: string; v: string; tone?: "up" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className={tone === "up" ? "text-up" : ""}>{v}</span>
    </div>
  );
}
