import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Wallet, LogOut, Check } from "lucide-react";
import { useTerminal } from "@/state/terminal";
import { LOGO } from "@/lib/art";

/** Inline profile menu: avatar + handle, with wallet + sign-out tucked inside. */
export function ProfileMenu() {
  const t = useTerminal();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const short = t.address ? `${t.address.slice(0, 5)}…${t.address.slice(-4)}` : null;
  const avatar = t.avatar ?? LOGO;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border-2 border-ink bg-screen py-1 pl-1 pr-2.5"
      >
        <img src={avatar} className="pixel h-7 w-7 rounded-full object-cover" alt="" />
        <span className="font-body text-sm font-bold">@{t.handle}</span>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div className="card absolute right-0 top-12 z-50 w-60 p-3 text-left">
          <div className="flex items-center gap-2 pb-2">
            <img src={avatar} className="pixel h-9 w-9 rounded-full object-cover" alt="" />
            <div className="min-w-0">
              <div className="truncate font-bold">@{t.handle}</div>
              <div className="text-xs text-ink-soft">
                {t.eligible ? "Eligible" : "Not yet eligible"}
              </div>
            </div>
          </div>

          <hr className="my-1 border-line" />

          {t.walletConnected ? (
            <div className="flex items-center gap-2 px-1 py-2 text-sm">
              <Check size={15} className="text-green" />
              <span className="tnum">{short}</span>
            </div>
          ) : (
            <button
              onClick={() => {
                t.connectWallet();
              }}
              className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-sm hover:bg-screen-2"
            >
              <Wallet size={15} /> Bind wallet
            </button>
          )}

          <button
            onClick={() => {
              t.signOut();
              navigate("/");
            }}
            className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-sm text-red hover:bg-screen-2"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
