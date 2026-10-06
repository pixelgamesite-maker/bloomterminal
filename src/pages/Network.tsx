import { useState } from "react";
import { Copy, UserPlus, Check } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/StatusDot";
import { useTerminal } from "@/state/terminal";
import { ECONOMY, BRAND } from "@/lib/config";
import type { AgentStatus } from "@/lib/types";

const STATUS_LABEL: Record<AgentStatus, string> = {
  invited: "Invited",
  connected: "Connected",
  wallet_pending: "Wallet required",
  active: "Active",
  eligible: "Eligible",
};

const STATUS_VARIANT: Record<AgentStatus, "muted" | "primary" | "accent" | "up"> = {
  invited: "muted",
  connected: "primary",
  wallet_pending: "accent",
  active: "up",
  eligible: "up",
};

export default function Network() {
  const t = useTerminal();
  const [copied, setCopied] = useState(false);
  const link = `${BRAND.joinBase}/${(t.handle ?? "operator").toUpperCase()}`;

  function copy() {
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-semibold tracking-wide">
          Agent network<span className="text-muted-foreground"> / referrals</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deploy {ECONOMY.requiredAgents} agents to activate your terminal. An
          agent counts once they reach <span className="text-up">eligible</span>.
        </p>
      </div>

      <Panel title="Your invite link">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-primary">
            {link}
          </code>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </Panel>

      <Panel
        title={`Network · ${t.activeAgents} / ${ECONOMY.requiredAgents} active`}
        action={
          <Button size="sm" onClick={t.inviteAgent}>
            <UserPlus size={14} /> Invite agent
          </Button>
        }
      >
        {t.agents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No agents yet. Invite one to simulate the onboarding flow.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {t.agents.map((a) => {
              const settled = a.status === "active" || a.status === "eligible";
              return (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <StatusDot
                    tone={settled ? "live" : a.status === "wallet_pending" ? "warn" : "idle"}
                  />
                  <span className="flex-1 font-mono text-sm">@{a.handle}</span>
                  {a.status === "wallet_pending" && (
                    <span className="hidden text-xs text-accent sm:inline">
                      Action required
                    </span>
                  )}
                  <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
