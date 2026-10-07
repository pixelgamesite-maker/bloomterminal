import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ComingSoonModal({
  title,
  blurb,
  art,
  onClose,
}: {
  title: string;
  blurb?: string;
  art?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-5">
      <div className="absolute inset-0 bg-room/50" onClick={onClose} aria-hidden />
      <div className="card relative w-full max-w-xs p-6 text-center">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md border-2 border-ink hover:bg-ink hover:text-screen"
          aria-label="Close"
        >
          <X size={15} />
        </button>
        {art && <img src={art} className="pixel mx-auto h-24 w-auto" alt="" />}
        <h2 className="display mt-3 text-xl">{title}</h2>
        <div className="mt-2 flex justify-center">
          <Badge variant="yellow">Coming soon</Badge>
        </div>
        {blurb && <p className="mt-3 text-sm text-ink-soft">{blurb}</p>}
        <Button className="mt-5 w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  );
}
