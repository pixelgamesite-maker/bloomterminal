import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { SignInModal } from "@/components/SignInModal";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { BackgroundChart } from "@/components/BackgroundChart";
import { Menu } from "@/components/Menu";
import { TvArt } from "@/components/TvArt";
import { useTerminal } from "@/state/terminal";
import { HERO, LOGO, CLASS_ART } from "@/lib/art";

type Soon = { title: string; blurb: string; art: string };

export default function Landing() {
  const navigate = useNavigate();
  const { xConnected, authLoading } = useTerminal();
  const [signingIn, setSigningIn] = useState(false);
  const [soon, setSoon] = useState<Soon | null>(null);
  const openSoon = (title: string, blurb: string, art: string) => setSoon({ title, blurb, art });

  if (!authLoading && xConnected) return <Navigate to="/app" replace />;

  return (
    <div className="relative min-h-full">
      <BackgroundChart />

      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-10">
        {/* top bar */}
        <div className="flex items-center justify-between py-4">
          <Menu onRegister={() => setSigningIn(true)} onComingSoon={openSoon} />
          <div className="flex items-center gap-2">
            <img src={LOGO} className="pixel h-7 w-7 rounded-md" alt="" />
            <span className="pixel text-xs">BLOOM</span>
          </div>
        </div>

        {/* hero */}
        <div className="boot flex flex-col items-center text-center">
          <img
            src={HERO}
            alt="A stack of little pixel televisions"
            className="float pixel w-full max-w-sm drop-shadow-[4px_6px_0_rgba(46,42,58,0.18)]"
          />
          <h1 className="display mt-5 text-3xl leading-tight sm:text-4xl">
            Register a worker.
            <br />
            Watch it bloom.
          </h1>
          <p className="mt-3 max-w-md text-sm text-ink-soft">
            Bloom is an onchain market terminal. Pick a little agent, point it at
            a market, and it earns Bloom while you're away.
          </p>
          <Button variant="pink" size="lg" className="mt-5" onClick={() => setSigningIn(true)}>
            Register a Worker
          </Button>
        </div>

        {/* how it works */}
        <section className="mt-12">
          <h2 className="display text-center text-xl">How it works</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Step n="1" art={CLASS_ART.analyst} title="Pick your agent" blurb="Choose one of four agents and a market — stocks or crypto." />
            <Step n="2" art={CLASS_ART.scout} title="Do your tasks" blurb="A few one-time tasks: follow, bind a wallet, invite friends." />
            <Step n="3" art={CLASS_ART.momentum} title="Earn Bloom" blurb="Your agent works and racks up Bloom. Mint later to multiply." />
          </div>
        </section>

        {/* ecosystem */}
        <section className="mt-12">
          <h2 className="display text-center text-xl">The ecosystem</h2>
          <div className="mt-4 space-y-3">
            <EcoCard
              art="/robinhood-watcher.png"
              title="Robinhood Watcher"
              status="soon"
              blurb="Track tokenized stocks — prices, charts, movers."
              cta="Preview"
              onClick={() => navigate("/watcher")}
            />
            <EcoCard
              art="/orange-monitor.png"
              title="Holders DEX"
              status="soon"
              blurb="Trade and track holders across the ecosystem."
              cta="Soon"
              onClick={() => openSoon("Holders DEX", "Trade and track holders. Not open yet.", "/orange-monitor.png")}
            />
            <EcoCard
              art="/opensea-monitor.png"
              title="OpenSea"
              status="soon"
              blurb="The Bloom collection, listed and tradable."
              cta="Soon"
              onClick={() => openSoon("OpenSea", "The collection drops here soon.", "/opensea-monitor.png")}
            />
          </div>
        </section>

        <footer className="mt-12 flex flex-col items-center gap-1 border-t-2 border-ink/15 pt-6 text-center">
          <div className="flex items-center gap-2">
            <img src={LOGO} className="pixel h-6 w-6 rounded" alt="" />
            <span className="pixel text-[0.6rem]">BLOOM TERMINAL</span>
          </div>
          <p className="text-xs text-ink-soft">Bloom NFT minting — coming soon.</p>
        </footer>
      </div>

      {signingIn && <SignInModal onClose={() => setSigningIn(false)} />}
      {soon && (
        <ComingSoonModal title={soon.title} blurb={soon.blurb} art={soon.art} onClose={() => setSoon(null)} />
      )}
    </div>
  );
}

function Step({ n, art, title, blurb }: { n: string; art: string; title: string; blurb: string }) {
  return (
    <Panel soft className="text-center">
      <div className="relative mx-auto w-fit">
        <TvArt src={art} size={72} />
        <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-pink pixel text-[0.6rem] text-white">
          {n}
        </span>
      </div>
      <div className="display mt-3 text-sm">{title}</div>
      <p className="mt-1 text-xs text-ink-soft">{blurb}</p>
    </Panel>
  );
}

function EcoCard({
  art,
  title,
  status,
  blurb,
  cta,
  onClick,
}: {
  art: string;
  title: string;
  status: "live" | "soon";
  blurb: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card-soft flex w-full items-center gap-3 p-3 text-left transition-transform hover:-translate-y-0.5"
    >
      <img src={art} className="pixel h-14 w-14 flex-none object-contain" alt="" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="display text-sm">{title}</span>
          <Badge variant={status === "live" ? "green" : "yellow"}>{status}</Badge>
        </div>
        <p className="truncate text-xs text-ink-soft">{blurb}</p>
      </div>
      <span className="flex items-center gap-1 pixel text-[0.6rem] text-ink-soft">
        {status === "live" ? <Eye size={13} /> : null}
        {cta} <ArrowRight size={12} />
      </span>
    </button>
  );
}
