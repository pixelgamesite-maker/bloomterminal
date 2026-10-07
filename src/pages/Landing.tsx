import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/SignInModal";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { HeroMonitors } from "@/components/HeroMonitors";
import { BackgroundChart } from "@/components/BackgroundChart";
import { useTerminal } from "@/state/terminal";
import { LOGO } from "@/lib/art";

export default function Landing() {
  const navigate = useNavigate();
  const { xConnected, authLoading } = useTerminal();
  const [signingIn, setSigningIn] = useState(false);
  const [soon, setSoon] = useState<{ title: string; blurb: string; art: string } | null>(null);

  if (!authLoading && xConnected) return <Navigate to="/app" replace />;

  return (
    <div className="relative min-h-full">
      <BackgroundChart />

      <div className="boot relative z-10 mx-auto flex min-h-full max-w-3xl flex-col items-center px-5 py-7 text-center">
        <div className="flex items-center gap-2.5">
          <img src={LOGO} className="pixel h-8 w-8 rounded-md" alt="" />
          <span className="pixel text-sm">BLOOM</span>
        </div>

        <div className="mt-4 w-full">
          <HeroMonitors
            onRegister={() => setSigningIn(true)}
            onWatcher={() => navigate("/watcher")}
            onHolders={() =>
              setSoon({
                title: "Holders DEX",
                blurb: "Trade and track holders. Not open yet.",
                art: "/orange-monitor.png",
              })
            }
            onOpensea={() =>
              setSoon({
                title: "OpenSea",
                blurb: "The collection drops here soon.",
                art: "/opensea-monitor.png",
              })
            }
          />
        </div>

        <h1 className="display mt-6 text-3xl leading-tight sm:text-4xl">
          Register a worker.
          <br />
          Watch it bloom.
        </h1>
        <p className="mt-2 text-sm text-ink-soft">Tap a screen to begin.</p>

        <Button variant="pink" size="lg" className="mt-5" onClick={() => setSigningIn(true)}>
          Register a Worker
        </Button>
      </div>

      {signingIn && <SignInModal onClose={() => setSigningIn(false)} />}
      {soon && (
        <ComingSoonModal
          title={soon.title}
          blurb={soon.blurb}
          art={soon.art}
          onClose={() => setSoon(null)}
        />
      )}
    </div>
  );
}
