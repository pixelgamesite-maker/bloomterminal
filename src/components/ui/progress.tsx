import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0..100
  className?: string;
  tone?: "primary" | "accent" | "up";
}

export function Progress({ value, className, tone = "primary" }: ProgressProps) {
  const toneClass =
    tone === "accent" ? "bg-accent" : tone === "up" ? "bg-up" : "bg-primary";
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", toneClass)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
