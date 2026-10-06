import { cn } from "@/lib/utils";

export function StatusDot({
  tone = "live",
  className,
}: {
  tone?: "live" | "idle" | "warn";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "dot",
        tone === "live" && "dot-live",
        tone === "idle" && "dot-idle",
        tone === "warn" && "dot-warn",
        className
      )}
    />
  );
}
