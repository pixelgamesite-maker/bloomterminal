import * as React from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  action?: React.ReactNode;
  bodyClassName?: string;
}

/**
 * A "dispatch" — the broadsheet's boxed article/section, with a ruled
 * header strip. Kept named Panel so callers don't churn.
 */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
  ...props
}: PanelProps) {
  return (
    <div className={cn("dispatch", className)} {...props}>
      {(title || action) && (
        <div className="dispatch-head">
          <span className="dispatch-title">{title}</span>
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  );
}
