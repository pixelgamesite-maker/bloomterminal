import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/SignInModal";
import { useTerminal } from "@/state/terminal";
import { HERO, LOGO } from "@/lib/art";

export default function Landing() {
  const { xConnected, authLoading } = useTerminal();
  const [signingIn, setSigningIn] = useState(false);

  // Already signed in → go straight to the app.
  if (!authLoading && xConnected) return <Navigate to="/app" replace />;

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center px-5 py-8 text-center">
      {/* brand */}
      <div className="flex items-center gap-2.5">
        <img src={LOGO} className="pixel h-8 w-8 rounded-md" alt="" />
        <span className="pixel text-sm">BLOOM</span>
      </div>

      {/* hero art */}
      <img
        src={HERO}
        alt="A stack of little pixel televisions"
        className="pixel mt-8 w-full max-w-md drop-shadow-[4px_6px_0_rgba(46,42,58,0.18)]"
      />

      <h1 className="display mt-7 text-4xl leading-tight sm:text-5xl">
        Register a worker.
        <br />
        Watch it bloom.
      </h1>

      <Button variant="pink" size="lg" className="mt-8" onClick={() => setSigningIn(true)}>
        Register a Worker
      </Button>

      {signingIn && <SignInModal onClose={() => setSigningIn(false)} />}
    </div>
  );
}
