import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/SignInModal";
import { HERO, LOGO } from "@/lib/art";

export default function Landing() {
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

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

      <p className="mt-4 max-w-md text-ink-soft">
        Give a little TV a job watching the markets. It earns Bloom while you
        are away. Mint later to multiply what it makes.
      </p>

      <Button variant="pink" size="lg" className="mt-8" onClick={() => setSigningIn(true)}>
        Register a Worker
      </Button>

      <p className="pixel mt-4 text-[0.6rem] text-ink-soft">DEMO · SIGN-IN SIMULATED</p>

      {signingIn && (
        <SignInModal
          onClose={() => setSigningIn(false)}
          onSignedIn={() => navigate("/app")}
        />
      )}
    </div>
  );
}
