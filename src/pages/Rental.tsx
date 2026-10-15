import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Rental() {
  return (
    <div className="min-h-screen">
      {/* top bar */}
      <div className="border-b-2 border-ink bg-screen/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-2.5 py-1 text-xs font-bold hover:bg-ink hover:text-screen"
          >
            <ArrowLeft size={14} /> Home
          </Link>
          <span className="pixel text-xs">
            BLOOM<span className="text-ink-soft"> // RENTAL</span>
            <span className="blink text-pink">_</span>
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-16 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-ink bg-screen-2 shadow-[var(--shadow-hard)]">
          <KeyRound size={34} className="text-ink-soft" />
        </div>

        <div className="mt-5 flex items-center gap-2">
          <h1 className="display text-3xl">Rental</h1>
          <Badge variant="yellow">Coming soon</Badge>
        </div>

        <p className="mt-3 max-w-sm text-sm text-ink-soft">
          Rent a fully-trained agent for a market, or lease yours out while it watches.
          A marketplace for Bloom terminals is on the way.
        </p>

        <div className="mt-6 grid w-full gap-2 sm:grid-cols-3">
          <Feature title="Rent an agent" blurb="Borrow a tuned agent for a market." />
          <Feature title="Lease yours" blurb="Earn while your agent works for others." />
          <Feature title="Set your terms" blurb="Pick duration and rate." />
        </div>

        <Link to="/" className="mt-7">
          <Button variant="pink">Back home</Button>
        </Link>
      </div>
    </div>
  );
}

function Feature({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="card-soft p-3 text-left">
      <div className="display text-sm">{title}</div>
      <p className="mt-0.5 text-[0.7rem] text-ink-soft">{blurb}</p>
    </div>
  );
}
