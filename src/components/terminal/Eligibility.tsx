import { Check, X } from "lucide-react";
import { useTerminal } from "@/state/terminal";
import { ECONOMY } from "@/lib/config";
import { cn } from "@/lib/utils";

interface Req {
  label: string;
  met: boolean;
  detail?: string;
}

export function useRequirements(): Req[] {
  const t = useTerminal();
  return [
    { label: "X account", met: t.xConnected, detail: t.handle ? `@${t.handle}` : "not connected" },
    { label: "Wallet", met: t.walletConnected, detail: t.walletConnected ? "bound" : "not bound" },
    { label: "Missions", met: t.missionsComplete, detail: `${t.missions.filter((m) => m.done).length} / ${t.missions.length}` },
    {
      label: "Active agents",
      met: t.activeAgents >= ECONOMY.requiredAgents,
      detail: `${t.activeAgents} / ${ECONOMY.requiredAgents}`,
    },
  ];
}

export function EligibilityChecklist({ compact }: { compact?: boolean }) {
  const reqs = useRequirements();
  return (
    <ul className="space-y-2">
      {reqs.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-4 w-4 place-items-center rounded-full",
                r.met ? "bg-up/20 text-up" : "bg-muted text-muted-foreground"
              )}
            >
              {r.met ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
            </span>
            <span className={cn(!r.met && "text-muted-foreground")}>{r.label}</span>
          </span>
          {!compact && (
            <span className="font-mono text-xs text-muted-foreground tnum">{r.detail}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
