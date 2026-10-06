import { Sparkles, Lock, Coins } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTerminal } from "@/state/terminal";
import { ECONOMY } from "@/lib/config";
import { fmt, cn } from "@/lib/utils";
import type { RewardState } from "@/lib/types";

const FLOW: RewardState[] = ["accumulating", "locked", "eligible", "claimable", "claimed"];

export default function Rewards() {
  const t = useTerminal();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-semibold tracking-wide">
          Rewards<span className="text-muted-foreground"> / bloom</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workers accrue Bloom while deployed. Balances stay locked until you
          hold the Bloom NFT.
        </p>
      </div>

      {/* balance hero */}
      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
              {t.nftMinted ? "Claimable balance" : "Accumulated (locked)"}
            </div>
            <div className="text-5xl font-semibold text-primary tnum">
              {fmt(t.displayBalance)}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              base {fmt(t.baseBalance)} × {t.multiplier.toFixed(2)} multiplier
            </div>
          </div>
          <RewardStateBadge state={t.rewardState} />
        </div>

        {/* flow */}
        <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[0.62rem] uppercase tracking-wider">
          {FLOW.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded px-2 py-1",
                  t.rewardState === s
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground"
                )}
              >
                {s}
              </span>
              {i < FLOW.length - 1 && <span className="text-muted-foreground/40">→</span>}
            </span>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        {/* NFT / multiplier */}
        <Panel title="Bloom NFT">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Reward multiplier</div>
              <div className="text-2xl font-semibold tnum">
                ×{(t.nftMinted ? ECONOMY.nftMultiplier : 1).toFixed(2)}
              </div>
            </div>
            {t.nftMinted ? (
              <Badge variant="up">Minted</Badge>
            ) : (
              <Badge variant="muted">Not minted</Badge>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The NFT enhances an existing system — it unlocks claims and boosts
            every worker's output by {ECONOMY.nftMultiplier}×.
          </p>
          {!t.nftMinted && (
            <Button className="mt-4 w-full" variant="accent" onClick={t.mint}>
              <Sparkles size={15} /> Mint Bloom NFT
            </Button>
          )}
        </Panel>

        {/* claim */}
        <Panel title="Claim">
          {!t.nftMinted ? (
            <div className="flex flex-col items-start gap-3">
              <Badge variant="accent">
                <Lock size={11} /> Locked
              </Badge>
              <p className="text-sm text-muted-foreground">
                Mint the Bloom NFT to unlock your accumulated rewards for claiming.
              </p>
              <Button className="w-full" disabled>
                Claim locked
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <div className="text-sm text-muted-foreground">Available to claim</div>
              <div className="text-2xl font-semibold text-primary tnum">
                {fmt(t.claimable)}
              </div>
              <Button
                className="w-full"
                disabled={t.claimable <= 0}
                onClick={t.claim}
              >
                <Coins size={15} /> Claim rewards
              </Button>
              {t.claimedTotal > 0 && (
                <div className="font-mono text-xs text-muted-foreground">
                  Claimed to date: <span className="text-up tnum">{fmt(t.claimedTotal)}</span>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        Note: demo reward rates and the ×{ECONOMY.nftMultiplier} multiplier are
        illustrative. Final emissions, caps and the reward formula are defined
        separately from the interface.
      </p>
    </div>
  );
}

function RewardStateBadge({ state }: { state: RewardState }) {
  const map: Record<RewardState, "muted" | "accent" | "primary" | "up"> = {
    accumulating: "primary",
    locked: "accent",
    eligible: "primary",
    claimable: "up",
    claimed: "muted",
  };
  return <Badge variant={map[state]}>{state}</Badge>;
}
