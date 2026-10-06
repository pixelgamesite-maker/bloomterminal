import { Link } from "react-router-dom";
import { Check, ExternalLink, Wallet, Users } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTerminal } from "@/state/terminal";
import type { Mission, MissionType } from "@/lib/types";

const TYPE_VARIANT: Record<MissionType, "primary" | "accent" | "up" | "default"> = {
  social: "primary",
  onchain: "accent",
  network: "up",
  terminal: "default",
};

export default function Missions() {
  const t = useTerminal();
  const done = t.missions.filter((m) => m.done).length;
  const progress = (done / t.missions.length) * 100;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-semibold tracking-wide">
          Missions<span className="text-muted-foreground"> / application</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete these to qualify your terminal. Requirements can change —
          missions are modular.
        </p>
      </div>

      <Panel>
        <div className="mb-2 flex items-center justify-between font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span>Application progress</span>
          <span className="tnum">
            {done} / {t.missions.length} · {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} tone={progress === 100 ? "up" : "primary"} />
      </Panel>

      <div className="grid gap-3">
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
    <Panel bodyClassName="flex items-center gap-4">
      <span
        className={`grid h-9 w-9 flex-none place-items-center rounded-md ${
          m.done ? "bg-up/20 text-up" : "bg-muted text-muted-foreground"
        }`}
      >
        {m.done ? <Check size={16} strokeWidth={3} /> : <TypeIcon type={m.type} />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{m.title}</span>
          <Badge variant={TYPE_VARIANT[m.type]}>{m.type}</Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">{m.description}</p>
      </div>

      <span className="hidden font-mono text-xs text-muted-foreground tnum sm:block">
        +{m.reward}
      </span>

      <div className="flex-none">
        {m.done ? (
          <Badge variant="up">Done</Badge>
        ) : m.id === "bind-wallet" ? (
          <Button size="sm" variant="accent" onClick={t.connectWallet}>
            <Wallet size={14} /> Connect
          </Button>
        ) : m.id === "invite-agents" ? (
          <Link to="/terminal/network">
            <Button size="sm" variant="outline">
              <Users size={14} /> Network
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" onClick={() => t.completeMission(m.id)}>
            {m.external && <ExternalLink size={14} />} Verify
          </Button>
        )}
      </div>
    </Panel>
  );
}

function TypeIcon({ type }: { type: MissionType }) {
  if (type === "onchain") return <Wallet size={16} />;
  if (type === "network") return <Users size={16} />;
  return <ExternalLink size={16} />;
}
