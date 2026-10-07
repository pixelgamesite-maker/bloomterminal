import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu as MenuIcon, X, Eye, Users, Ship, Twitter, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LOGO } from "@/lib/art";
import { X_URL } from "@/lib/mock";

interface Item {
  label: string;
  icon: typeof Home;
  soon?: boolean;
  onClick: () => void;
}

/** The site hamburger menu for public pages. */
export function Menu({
  onRegister,
  onComingSoon,
}: {
  onRegister: () => void;
  onComingSoon: (title: string, blurb: string, art: string) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const items: Item[] = [
    { label: "Home", icon: Home, onClick: go(() => navigate("/")) },
    { label: "Robinhood Watcher", icon: Eye, onClick: go(() => navigate("/watcher")) },
    {
      label: "Holders DEX",
      icon: Users,
      soon: true,
      onClick: go(() => onComingSoon("Holders DEX", "Trade and track holders. Not open yet.", "/orange-monitor.png")),
    },
    {
      label: "OpenSea",
      icon: Ship,
      soon: true,
      onClick: go(() => onComingSoon("OpenSea", "The collection drops here soon.", "/opensea-monitor.png")),
    },
    { label: "Follow on X", icon: Twitter, onClick: go(() => window.open(X_URL, "_blank", "noopener")) },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-screen hover:bg-ink hover:text-screen"
        aria-label="Open menu"
      >
        <MenuIcon size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-room/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[min(84vw,20rem)] overflow-y-auto border-r-2 border-ink bg-screen p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <div className="flex items-center gap-2">
                <img src={LOGO} className="pixel h-8 w-8 rounded-md" alt="" />
                <span className="pixel text-sm">BLOOM</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md border-2 border-ink hover:bg-ink hover:text-screen"
                aria-label="Close menu"
              >
                <X size={15} />
              </button>
            </div>

            <nav className="mt-3 space-y-1">
              {items.map((it) => (
                <button
                  key={it.label}
                  onClick={it.onClick}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left font-bold hover:bg-screen-2"
                >
                  <it.icon size={18} />
                  <span className="flex-1">{it.label}</span>
                  {it.soon && <Badge variant="yellow">soon</Badge>}
                </button>
              ))}
            </nav>

            <Button variant="pink" className="mt-4 w-full" onClick={go(onRegister)}>
              Register a Worker
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
