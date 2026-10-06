import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTerminal } from "@/state/terminal";
import { LOGO } from "@/lib/art";

/**
 * The "Register a Worker" gate. Sign-in is simulated for now; this is where
 * real X OAuth drops in (supabase.auth.signInWithOAuth({ provider: 'twitter' })).
 */
export function SignInModal({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const { connectX } = useTerminal();
  const [handle, setHandle] = useState("");

  function signIn() {
    connectX(handle);
    onSignedIn();
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-5">
      <div className="absolute inset-0 bg-room/50" onClick={onClose} aria-hidden />
      <div className="card relative w-full max-w-sm p-6 text-center">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md border-2 border-ink hover:bg-ink hover:text-screen"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        <img src={LOGO} className="pixel mx-auto h-12 w-12 rounded-lg" alt="" />
        <h2 className="display mt-3 text-xl">Sign in to continue</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Connect your X account to register your worker.
        </p>

        <div className="mt-5 flex items-center rounded-lg border-2 border-ink bg-screen-2 px-3 h-11">
          <span className="text-ink-soft">@</span>
          <input
            autoFocus
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
            placeholder="your_handle"
            aria-label="X handle"
            className="w-full bg-transparent px-1 font-body font-semibold outline-none placeholder:text-ink-soft/60"
          />
        </div>

        <Button variant="blue" className="mt-4 w-full" onClick={signIn}>
          Sign in with X
        </Button>
        <p className="pixel mt-3 text-[0.55rem] text-ink-soft">
          NO REAL X CALL YET — DEMO
        </p>
      </div>
    </div>
  );
}
