import { useState } from "react";
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

const STATUS_VARIANT: Record<AgentStatus, "muted" | "claret" | "up"> = {
  invited: "muted",
  connected: "muted",
  wallet_pending: "claret",
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
    <div className="space-y-6">
      <header className="border-b border-rule-strong pb-3">
        <p className="kicker">Classifieds — Situations Wanted</p>
        <h2 className="headline mt-1 text-4xl sm:text-5xl">The Agent Network</h2>
        <p className="subhead mt-2 text-lg">
          Deploy {ECONOMY.requiredAgents} agents to activate your terminal. An
          agent is counted only once it reaches eligible standing.
        </p>
      </header>

      <Panel title="Your Notice of Invitation">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate border border-rule-strong bg-paper-2 px-3 py-2 font-head text-[0.95rem]">
            {link}
          </code>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? "Copied" : "Copy notice"}
          </Button>
        </div>
      </Panel>

      <Panel
        title={`Network — ${t.activeAgents} of ${ECONOMY.requiredAgents} active`}
        action={
          <Button size="sm" onClick={t.inviteAgent}>
            Post an invitation
          </Button>
        }
      >
        {t.agents.length === 0 ? (
          <p className="py-6 text-center italic text-ink-soft">
            No agents on file. Post an invitation to watch the onboarding unfold.
          </p>
        ) : (
          <ul className="divide-y divide-dotted divide-rule">
            {t.agents.map((a) => {
              const settled = a.status === "active" || a.status === "eligible";
              return (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <StatusDot
                    tone={settled ? "live" : a.status === "wallet_pending" ? "warn" : "idle"}
                  />
                  <span className="flex-1 font-head font-semibold">@{a.handle}</span>
                  {a.status === "wallet_pending" && (
                    <span className="hidden text-sm italic text-claret sm:inline">
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
