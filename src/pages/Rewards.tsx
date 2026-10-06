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
    <div className="space-y-6">
      <header className="border-b border-rule-strong pb-3">
        <p className="kicker">Markets — Bloom &amp; Bullion</p>
        <h2 className="headline mt-1 text-4xl sm:text-5xl">The Ledger</h2>
        <p className="subhead mt-2 text-lg">
          Workers accrue Bloom while on post. The ledger stays sealed until the
          holder mints the Bloom NFT.
        </p>
      </header>

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="folio">{t.nftMinted ? "Claimable balance" : "Accrued, under seal"}</div>
            <div className="headline text-6xl tnum">{fmt(t.displayBalance)}</div>
            <div className="mt-1 text-sm italic text-ink-soft tnum">
              base {fmt(t.baseBalance)} × {t.multiplier.toFixed(2)} multiplier
            </div>
          </div>
          <RewardStateBadge state={t.rewardState} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-head text-sm">
          {FLOW.map((s, i) => (
            <span key={s} className="flex items-center gap-3">
              <span
                className={cn(
                  "uppercase tracking-wide",
                  t.rewardState === s ? "font-semibold text-claret underline underline-offset-4" : "text-ink-soft"
                )}
              >
                {s}
              </span>
              {i < FLOW.length - 1 && <span className="text-ink-faint">→</span>}
            </span>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="The Bloom NFT">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-ink-soft">Reward multiplier</div>
              <div className="headline text-3xl tnum">
                ×{(t.nftMinted ? ECONOMY.nftMultiplier : 1).toFixed(2)}
              </div>
            </div>
            {t.nftMinted ? <span className="seal text-xs">Minted</span> : <Badge variant="muted">Not minted</Badge>}
          </div>
          <p className="mt-3 justify text-[0.98rem] text-ink-soft">
            The NFT enhances an existing system — it unseals the ledger and lifts
            every worker&rsquo;s output by {ECONOMY.nftMultiplier}×.
          </p>
          {!t.nftMinted && (
            <Button className="mt-4 w-full h-11" variant="claret" onClick={t.mint}>
              Mint the Bloom NFT
            </Button>
          )}
        </Panel>

        <Panel title="Claim">
          {!t.nftMinted ? (
            <div className="flex flex-col items-start gap-3">
              <Badge variant="claret">Under seal</Badge>
              <p className="justify text-[0.98rem] text-ink-soft">
                Mint the Bloom NFT to break the seal and release your accrued
                Bloom for claiming.
              </p>
              <Button className="w-full h-11" disabled>
                Claim sealed
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <div className="text-ink-soft">Available to claim</div>
              <div className="headline text-3xl tnum">{fmt(t.claimable)}</div>
              <Button className="w-full h-11" disabled={t.claimable <= 0} onClick={t.claim}>
                Claim rewards
              </Button>
              {t.claimedTotal > 0 && (
                <div className="text-sm italic text-ink-soft">
                  Claimed to date: <span className="text-up tnum">{fmt(t.claimedTotal)}</span>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <p className="border-t border-rule pt-3 text-sm italic text-ink-soft">
        Editor&rsquo;s note: demo accrual rates and the ×{ECONOMY.nftMultiplier}{" "}
        multiplier are illustrative. Final emissions, caps and the reward formula
        are set separately from this edition.
      </p>
    </div>
  );
}

function RewardStateBadge({ state }: { state: RewardState }) {
  const map: Record<RewardState, "muted" | "claret" | "up"> = {
    accumulating: "muted",
    locked: "claret",
    eligible: "muted",
    claimable: "up",
    claimed: "muted",
  };
  return <Badge variant={map[state]}>{state}</Badge>;
}
