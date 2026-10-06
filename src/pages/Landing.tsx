import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TickerStrip } from "@/components/terminal/MarketTable";
import { useTerminal } from "@/state/terminal";

export default function Landing() {
  const navigate = useNavigate();
  const { connectX } = useTerminal();
  const [handle, setHandle] = useState("");

  function enter() {
    connectX(handle);
    navigate("/terminal");
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      {/* masthead */}
      <header className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between pt-3 pb-1 folio">
          <span>Vol. I · No. 1</span>
          <span className="hidden sm:block">{today}</span>
          <span>Onchain Edition</span>
        </div>
        <hr className="rule-thick" />
        <div className="py-4 text-center">
          <h1 className="nameplate text-6xl sm:text-8xl">The Bloom Herald</h1>
          <p className="folio mt-2">
            Onchain Market Intelligence · Deploy Your Agent · Watch It Bloom
          </p>
        </div>
        <hr className="rule-double" />
      </header>

      <TickerStrip />

      {/* front page */}
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.8fr_1fr]">
        {/* lead story */}
        <article className="lg:pr-7">
          <p className="kicker">Late Market Edition — Whitelist Now Open</p>
          <h2 className="headline mt-2 text-5xl sm:text-6xl">
            A Terminal of One&rsquo;s Own, and an Agent to Work It
          </h2>
          <p className="subhead mt-3 text-xl">
            Readers connect, qualify, and deploy autonomous workers to monitor
            tokenized markets — earning Bloom before a single token is minted.
          </p>

          <hr className="rule-hair my-5" />

          <div className="gap-6 text-[1.02rem] leading-relaxed sm:columns-2">
            <p className="dropcap justify">
              Bloom opens not with the familiar rush of a mint page but with a
              terminal — a private desk from which every reader surveys the
              tokenized market. Sign in, bind a wallet, and the desk begins to
              unlock, panel by panel, as each requirement is met.
            </p>
            <p className="justify mt-3">
              From there a worker is commissioned: named, given a class and a
              market to watch, and sent to its post. It files its output as
              Bloom, accruing quietly whether or not anyone is watching. The
              Bloom NFT, when minted, does not gate the work — it multiplies it,
              and releases the ledger for claiming.
            </p>
            <p className="justify mt-3">
              The market watcher, our editors note, is but one column of a wider
              paper: intelligence, agents, and an economy that rewards the
              attentive.
            </p>
          </div>
        </article>

        {/* subscribe box */}
        <aside className="lg:border-l lg:border-rule-strong lg:pl-6">
          <div className="dispatch">
            <div className="dispatch-head">
              <span className="dispatch-title">Claim Your Terminal</span>
            </div>
            <div className="p-4">
              <p className="text-[0.98rem] text-ink-soft">
                Enter your handle to open the desk. Sign-in is simulated for this
                edition — no real X or wallet calls are made yet.
              </p>
              <div className="mt-4 flex items-center border-2 border-rule-strong bg-paper-2 px-3 h-12 font-head">
                <span className="text-ink-soft">@</span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enter()}
                  placeholder="your_handle"
                  aria-label="X handle"
                  className="w-full bg-transparent px-1 outline-none placeholder:text-ink-faint"
                />
              </div>
              <Button className="mt-3 w-full h-12" onClick={enter}>
                Enter the Terminal
              </Button>
            </div>
          </div>

          <div className="dispatch mt-5">
            <div className="dispatch-head">
              <span className="dispatch-title">Reader&rsquo;s Desk — Specimen</span>
            </div>
            <div className="p-4 text-[0.95rem]">
              <Row k="X account" v="filed" />
              <Row k="Wallet" v="bound" />
              <Row k="Agents" v="2 of 2" />
              <Row k="Eligibility" v="confirmed" />
              <hr className="rule-hair my-2" />
              <Row k="Worker" v="ORION · Scout" />
              <Row k="Status" v="active" />
              <div className="mt-3 text-center">
                <div className="folio">Bloom on the books</div>
                <div className="headline text-4xl tnum">2,481.32</div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-dotted border-rule py-1">
      <span className="text-ink-soft">{k}</span>
      <span className="font-head font-semibold">{v}</span>
    </div>
  );
}
