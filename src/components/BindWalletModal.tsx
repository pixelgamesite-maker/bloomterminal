import { useState } from "react";
import { X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTerminal } from "@/state/terminal";

/** Paste-an-address wallet bind with EVM validation. */
export function BindWalletModal({ onClose }: { onClose: () => void }) {
  const { bindWallet } = useTerminal();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const ok = bindWallet(value);
    if (!ok) {
      setError("That doesn't look like a valid EVM address (0x + 40 hex).");
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-5">
      <div className="absolute inset-0 bg-room/50" onClick={onClose} aria-hidden />
      <div className="card relative w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md border-2 border-ink hover:bg-ink hover:text-screen"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        <div className="flex items-center gap-2">
          <Wallet size={18} />
          <h2 className="display text-lg">Bind your wallet</h2>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Paste the EVM address rewards should go to.
        </p>

        <input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="0x…"
          spellCheck={false}
          aria-label="EVM wallet address"
          className="mt-4 w-full rounded-lg border-2 border-ink bg-screen-2 px-3 py-3 font-mono text-sm outline-none placeholder:text-ink-soft/50"
        />
        {error && <p className="mt-2 text-sm text-red">{error}</p>}

        <Button variant="green" className="mt-4 w-full" onClick={submit}>
          Bind wallet
        </Button>
      </div>
    </div>
  );
}
