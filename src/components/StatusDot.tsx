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
        "inkdot",
        tone === "live" && "inkdot-live",
        tone === "idle" && "inkdot-idle",
        tone === "warn" && "inkdot-warn",
        className
      )}
    />
  );
}
