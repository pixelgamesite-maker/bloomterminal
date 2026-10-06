import { Link } from "react-router-dom";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTerminal } from "@/state/terminal";
import type { Mission, MissionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_VARIANT: Record<MissionType, "claret" | "ink" | "up" | "default"> = {
  social: "claret",
  onchain: "ink",
  network: "up",
  terminal: "default",
};

export default function Missions() {
  const t = useTerminal();
  const done = t.missions.filter((m) => m.done).length;
  const progress = (done / t.missions.length) * 100;

  return (
    <div className="space-y-6">
      <header className="border-b border-rule-strong pb-3">
        <p className="kicker">The Application</p>
        <h2 className="headline mt-1 text-4xl sm:text-5xl">Terms of Admission</h2>
        <p className="subhead mt-2 text-lg">
          Complete each notice to qualify your terminal. Requirements are modular
          and subject to revision without further printing.
        </p>
      </header>

      <Panel title="Application Progress">
        <div className="mb-2 flex items-baseline justify-between folio">
          <span>Filed</span>
          <span className="tnum">
            {done} of {t.missions.length} · {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} />
      </Panel>

      <div className="divide-y divide-rule border-t border-b border-rule-strong">
        {t.missions.map((m) => (
          <MissionRow key={m.id} mission={m} />
        ))}
      </div>
    </div>
  );
}

function MissionRow({ mission: m }: { mission: Mission }) {
  const t = useTerminal();

  return (
    <div className="flex items-center gap-4 py-4">
      <span
        className={cn(
          "grid h-10 w-10 flex-none place-items-center border font-head text-lg font-semibold",
          m.done ? "border-up text-up" : "border-rule text-ink-faint"
        )}
      >
        {m.done ? "✓" : "§"}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="headline text-xl">{m.title}</span>
          <Badge variant={TYPE_VARIANT[m.type]}>{m.type}</Badge>
        </div>
        <p className="truncate text-[0.98rem] text-ink-soft">{m.description}</p>
      </div>

      <span className="hidden italic text-ink-soft tnum sm:block">+{m.reward}</span>

      <div className="flex-none">
        {m.done ? (
          <Badge variant="up">Filed</Badge>
        ) : m.id === "bind-wallet" ? (
          <Button size="sm" variant="claret" onClick={t.connectWallet}>
            Bind
          </Button>
        ) : m.id === "invite-agents" ? (
          <Link to="/terminal/network">
            <Button size="sm" variant="outline">
              Network
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" onClick={() => t.completeMission(m.id)}>
            Verify
          </Button>
        )}
      </div>
    </div>
  );
}
