import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Target,
  Users,
  Cpu,
  Coins,
  Lock,
  Power,
} from "lucide-react";
import { useTerminal } from "@/state/terminal";
import { StatusDot } from "@/components/StatusDot";
import { Badge } from "@/components/ui/badge";
import { cn, fmt } from "@/lib/utils";

const NAV = [
  { to: "/terminal", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/terminal/missions", label: "Missions", icon: Target },
  { to: "/terminal/network", label: "Network", icon: Users },
  { to: "/terminal/workforce", label: "Workforce", icon: Cpu, gated: true },
  { to: "/terminal/rewards", label: "Rewards", icon: Coins },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="tnum">{now.toLocaleTimeString("en-GB")}</span>;
}

export default function TerminalLayout() {
  const t = useTerminal();
  const navigate = useNavigate();

  function signOut() {
    t.signOut();
    navigate("/");
  }

  return (
    <div className="bloom-grid-bg min-h-screen">
      {/* top status bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold tracking-widest">
            <span className="text-primary">◆</span> BLOOM
            <span className="hidden text-muted-foreground sm:inline">TERMINAL</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <span className="hidden items-center gap-2 md:flex">
              <StatusDot tone="live" /> ONLINE
            </span>
            <span className="hidden sm:inline">
              <Clock />
            </span>
            {t.eligible ? (
              <Badge variant="up">Eligible</Badge>
            ) : (
              <Badge variant="muted">Locked</Badge>
            )}
            <span className="hidden text-foreground sm:inline">@{t.handle}</span>
            <button
              onClick={signOut}
              className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              aria-label="Sign out"
              title="Sign out"
            >
              <Power size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[200px_1fr]">
        {/* nav */}
        <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV.map((item) => {
            const locked = item.gated && !t.eligible;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={(e) => locked && e.preventDefault()}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                    isActive && !locked
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    locked && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground"
                  )
                }
              >
                <item.icon size={15} />
                <span>{item.label}</span>
                {locked && <Lock size={11} className="ml-auto hidden lg:block" />}
              </NavLink>
            );
          })}

          {/* balance mini readout */}
          <div className="mt-2 hidden rounded-md border border-border bg-panel p-3 lg:block">
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
              Bloom balance
            </div>
            <div className="mt-1 text-lg font-semibold text-primary tnum">
              {fmt(t.displayBalance)}
            </div>
            <div className="mt-0.5 font-mono text-[0.62rem] text-muted-foreground">
              ×{t.multiplier.toFixed(2)} multiplier
            </div>
          </div>
        </nav>

        {/* routed content */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
