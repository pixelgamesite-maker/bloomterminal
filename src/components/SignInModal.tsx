import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTerminal } from "@/state/terminal";
import { LOGO } from "@/lib/art";

/** Real X sign-in (Supabase OAuth). Clicking redirects to X and back to /app. */
export function SignInModal({ onClose }: { onClose: () => void }) {
  const { signInWithX } = useTerminal();
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      await signInWithX();
    } finally {
      setBusy(false);
    }
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

        <Button variant="blue" className="mt-5 w-full" onClick={signIn} disabled={busy}>
          <XLogo /> {busy ? "Connecting…" : "Sign in with X"}
        </Button>
      </div>
    </div>
  );
}

function XLogo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
