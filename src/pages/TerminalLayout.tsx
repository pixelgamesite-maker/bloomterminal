import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Lock } from "lucide-react";
import { useTerminal } from "@/state/terminal";
import { TickerStrip } from "@/components/terminal/MarketTable";
import { fmt } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { to: "/terminal", label: "Front Page", kicker: "No. 1", end: true },
  { to: "/terminal/missions", label: "The Application", kicker: "Dispatches" },
  { to: "/terminal/network", label: "Agent Network", kicker: "Classifieds" },
  { to: "/terminal/workforce", label: "The Workforce", kicker: "Industry", gated: true },
  { to: "/terminal/rewards", label: "Bloom & Bullion", kicker: "Markets" },
];

function todayLine() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TerminalLayout() {
  const t = useTerminal();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // close the drawer whenever the route changes
  useEffect(() => setMenuOpen(false), [location.pathname]);

  function signOut() {
    t.signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen">
      {/* ---- Masthead ---- */}
      <header className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between pt-3 pb-1 folio">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 border border-rule-strong px-2 py-1 hover:bg-ink hover:text-paper"
            aria-label="Open sections"
          >
            <Menu size={15} /> <span className="hidden sm:inline">Sections</span>
          </button>
          <span className="hidden text-center sm:block">{todayLine()}</span>
          <span className="flex items-center gap-2">
            {t.eligible ? "Eligible Subscriber" : "Trial Reader"} · @{t.handle}
          </span>
        </div>

        <hr className="rule-thick" />
        <div className="py-3 text-center">
          <h1 className="nameplate text-5xl sm:text-6xl">The Bloom Herald</h1>
          <p className="folio mt-1.5">
            Onchain Market Intelligence · Deploy Your Agent · Watch It Bloom
          </p>
        </div>
        <hr className="rule-double" />
      </header>

      <TickerStrip />

      {/* ---- Section flag ---- */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between border-b border-rule-strong py-2">
          <span className="kicker">
            {SECTIONS.find((s) =>
              s.end ? location.pathname === s.to : location.pathname.startsWith(s.to)
            )?.label ?? "Front Page"}
          </span>
          <span className="folio tnum">
            Bloom balance — {fmt(t.displayBalance)} · ×{t.multiplier.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ---- Body ---- */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl border-t border-rule-strong px-4 py-5 folio">
        The Bloom Herald · Published onchain · Demo edition — sign-in &amp; wallet
        simulated
      </footer>

      {/* ---- Sections drawer ---- */}
      {menuOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,22rem)] overflow-y-auto border-r-2 border-rule-strong bg-paper p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-rule-strong pb-3">
              <span className="nameplate text-2xl">Sections</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="border border-rule-strong p-1 hover:bg-ink hover:text-paper"
                aria-label="Close sections"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="mt-2">
              {SECTIONS.map((s) => {
                const locked = s.gated && !t.eligible;
                return (
                  <NavLink
                    key={s.to}
                    to={s.to}
                    end={s.end}
                    onClick={(e) => locked && e.preventDefault()}
                    className={({ isActive }) =>
                      cn(
                        "block border-b border-dotted border-rule py-3",
                        locked && "cursor-not-allowed opacity-45",
                        isActive && !locked && "text-claret"
                      )
                    }
                  >
                    <span className="kicker block text-[0.6rem]">{s.kicker}</span>
                    <span className="headline flex items-center gap-2 text-2xl">
                      {s.label}
                      {locked && <Lock size={14} />}
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            <button onClick={signOut} className="mt-5 w-full ink-btn ink-btn-ghost h-10 text-sm">
              Cancel subscription (sign out)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
