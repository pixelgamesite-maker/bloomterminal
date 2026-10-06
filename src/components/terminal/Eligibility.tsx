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
    { label: "X account", met: t.xConnected, detail: t.handle ? `@${t.handle}` : "not filed" },
    { label: "Wallet", met: t.walletConnected, detail: t.walletConnected ? "bound" : "not bound" },
    {
      label: "Missions",
      met: t.missionsComplete,
      detail: `${t.missions.filter((m) => m.done).length} of ${t.missions.length}`,
    },
    {
      label: "Active agents",
      met: t.activeAgents >= ECONOMY.requiredAgents,
      detail: `${t.activeAgents} of ${ECONOMY.requiredAgents}`,
    },
  ];
}

export function EligibilityChecklist({ compact }: { compact?: boolean }) {
  const reqs = useRequirements();
  return (
    <ul>
      {reqs.map((r, i) => (
        <li
          key={r.label}
          className={cn(
            "flex items-baseline justify-between gap-3 py-1.5",
            i < reqs.length - 1 && "border-b border-dotted border-rule"
          )}
        >
          <span className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-head font-semibold",
                r.met ? "text-up" : "text-ink-faint"
              )}
            >
              {r.met ? "✓" : "✗"}
            </span>
            <span className={cn(!r.met && "text-ink-soft")}>{r.label}</span>
          </span>
          {!compact && <span className="text-sm italic text-ink-soft tnum">{r.detail}</span>}
        </li>
      ))}
    </ul>
  );
}
