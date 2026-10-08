import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Watcher() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-screen"
        >
          <ArrowLeft size={15} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <img src="/robinhood-watcher.png" className="pixel h-8 w-auto" alt="" />
          <span className="pixel text-xs">WATCHER</span>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center text-center">
        <img
          src="/robinhood-watcher.png"
          alt="Robinhood Watcher"
          className="pixel w-48 drop-shadow-[4px_6px_0_rgba(46,42,58,0.18)]"
        />
        <div className="mt-6 flex items-center gap-2">
          <h1 className="display text-3xl">Robinhood Watcher</h1>
          <Badge variant="yellow">Coming soon</Badge>
        </div>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          Live prices, charts and movers for tokenized stocks — plugging into a
          real feed. Not open yet.
        </p>
        <Link to="/" className="mt-6">
          <Button variant="pink">Back home</Button>
        </Link>
      </div>
    </div>
  );
}
