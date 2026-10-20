import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, X, Activity, Zap, Cpu, HardDrive, Clock, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TvArt } from "@/components/TvArt";

type Cur = "USDG" | "ETH";

interface Rig {
  id: string;
  name: string;
  tier: string;
  art: string;
  accent: "blue" | "green" | "yellow" | "pink";
  hash: string;
  power: string;
  memory: string;
  cores: string;
  uptime: string;
  yield: string;
  usdg: number;
  eth: number;
}

// ETH prices mirror USDG / ~2500 so the toggle stays consistent.
const RIGS: Rig[] = [
  { id: "spark", name: "Spark", tier: "Tier I", art: "/2.jpeg", accent: "blue",
    hash: "120 MH/s", power: "450 W", memory: "8 GB", cores: "4 vCPU", uptime: "99.9%", yield: "~320 / day",
    usdg: 25, eth: 0.01 },
  { id: "pulse", name: "Pulse", tier: "Tier II", art: "/1.jpeg", accent: "green",
    hash: "320 MH/s", power: "900 W", memory: "16 GB", cores: "8 vCPU", uptime: "99.9%", yield: "~820 / day",
    usdg: 60, eth: 0.024 },
  { id: "surge", name: "Surge", tier: "Tier III", art: "/4.jpeg", accent: "yellow",
    hash: "680 MH/s", power: "1.6 kW", memory: "24 GB", cores: "16 vCPU", uptime: "99.95%", yield: "~1,750 / day",
    usdg: 120, eth: 0.048 },
  { id: "nova", name: "Nova", tier: "Tier IV", art: "/3.jpeg", accent: "pink",
    hash: "1.3 GH/s", power: "3.2 kW", memory: "48 GB", cores: "32 vCPU", uptime: "99.95%", yield: "~3,600 / day",
    usdg: 250, eth: 0.1 },
];

const price = (r: Rig, cur: Cur) => (cur === "USDG" ? `${r.usdg.toLocaleString()} USDG` : `${r.eth} ETH`);

export default function Rental() {
  const [cur, setCur] = useState<Cur>("USDG");
  const [open, setOpen] = useState<Rig | null>(null);

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <div className="sticky top-0 z-30 border-b-2 border-ink bg-screen/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-2.5 py-1 text-xs font-bold hover:bg-ink hover:text-screen"
          >
            <ArrowLeft size={14} /> Home
          </Link>
          <span className="pixel text-xs">
            BLOOM<span className="text-ink-soft"> // RENTAL</span>
            <span className="blink text-pink">_</span>
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="display text-3xl">Rental</h1>
              <Badge variant="yellow">Coming soon</Badge>
            </div>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              Rent a compute rig to run your agent harder. Pay in USDG or ETH on
              Robinhood Chain. Pick a tier, see the specs, reserve soon.
            </p>
          </div>

          {/* currency toggle */}
          <div className="flex flex-col items-end gap-1">
            <div className="tabs">
              <button className="tab" data-active={cur === "USDG"} onClick={() => setCur("USDG")}>USDG</button>
              <button className="tab" data-active={cur === "ETH"} onClick={() => setCur("ETH")}>ETH</button>
            </div>
            <span className="text-[0.6rem] text-ink-soft">
              {cur === "USDG" ? "Robinhood Chain stablecoin" : "gas token"}
            </span>
          </div>
        </div>

        {/* rig grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {RIGS.map((r) => (
            <RigCard key={r.id} r={r} cur={cur} onRent={() => setOpen(r)} />
          ))}
        </div>

        <p className="mt-5 text-center text-[0.65rem] text-ink-soft">
          Specs are projected. Rentals and on-chain billing open soon.
        </p>
      </div>

      {open && <RentModal r={open} cur={cur} onToggleCur={setCur} onClose={() => setOpen(null)} />}
    </div>
  );
}

function RigCard({ r, cur, onRent }: { r: Rig; cur: Cur; onRent: () => void }) {
  return (
    <div className="card-soft flex flex-col overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <TvArt src={r.art} size={76} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="display text-lg leading-none">{r.name}</span>
            <Badge variant={r.accent}>{r.tier}</Badge>
          </div>
          <div className="mt-2 space-y-1 text-xs text-ink-soft">
            <SpecLine icon={<Activity size={12} />} label="Hash" value={r.hash} />
            <SpecLine icon={<Zap size={12} />} label="Power" value={r.power} />
            <SpecLine icon={<Cpu size={12} />} label="Compute" value={r.cores} />
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t-2 border-ink/10 px-3 py-2.5">
        <div>
          <div className="pixel text-[0.52rem] text-ink-soft">PRICE · PER DAY</div>
          <div className="display text-lg tabular-nums">{price(r, cur)}</div>
        </div>
        <Button size="sm" variant="pink" onClick={onRent}>
          Rent
        </Button>
      </div>
    </div>
  );
}

function SpecLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-ink-soft">{icon}</span>
      <span className="w-14 text-ink-soft">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}

function RentModal({
  r,
  cur,
  onToggleCur,
  onClose,
}: {
  r: Rig;
  cur: Cur;
  onToggleCur: (c: Cur) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const other = cur === "USDG" ? `${r.eth} ETH` : `${r.usdg.toLocaleString()} USDG`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="card max-h-[92vh] w-full max-w-md overflow-auto rounded-b-none sm:rounded-b-[var(--radius)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b-2 border-ink bg-screen px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <TvArt src={r.art} size={44} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="display text-base leading-none">{r.name}</span>
                <Badge variant={r.accent}>{r.tier}</Badge>
              </div>
              <div className="pixel text-[0.55rem] text-ink-soft">COMPUTE RIG</div>
            </div>
          </div>
          <button onClick={onClose} className="btn h-9 w-9 flex-none p-0" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="p-4">
          {/* compute stats */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatTile icon={<Activity size={14} />} label="Hash rate" value={r.hash} />
            <StatTile icon={<Zap size={14} />} label="Power draw" value={r.power} />
            <StatTile icon={<HardDrive size={14} />} label="Memory" value={r.memory} />
            <StatTile icon={<Cpu size={14} />} label="Compute" value={r.cores} />
            <StatTile icon={<Clock size={14} />} label="Uptime" value={r.uptime} />
            <StatTile icon={<Gauge size={14} />} label="Est. yield" value={r.yield} />
          </div>

          {/* price + currency toggle */}
          <div className="mt-4 flex items-end justify-between rounded-[var(--radius)] border-2 border-ink bg-screen-2 p-3">
            <div>
              <div className="pixel text-[0.52rem] text-ink-soft">PRICE · PER DAY</div>
              <div className="display text-2xl tabular-nums">{price(r, cur)}</div>
              <div className="text-[0.65rem] text-ink-soft">≈ {other}</div>
            </div>
            <div className="tabs">
              <button className="tab" data-active={cur === "USDG"} onClick={() => onToggleCur("USDG")}>USDG</button>
              <button className="tab" data-active={cur === "ETH"} onClick={() => onToggleCur("ETH")}>ETH</button>
            </div>
          </div>

          <Button className="mt-4 w-full" disabled>
            Coming soon
          </Button>
          <p className="mt-2 text-center text-[0.6rem] text-ink-soft">
            Reserve opens soon. Projected specs, billed on Robinhood Chain.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-soft px-3 py-2">
      <div className="flex items-center gap-1.5 text-[0.58rem] uppercase tracking-wide text-ink-soft">
        {icon} {label}
      </div>
      <div className="display mt-0.5 text-sm tabular-nums">{value}</div>
    </div>
  );
}
