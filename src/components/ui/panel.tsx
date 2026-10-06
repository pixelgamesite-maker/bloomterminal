import * as React from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  action?: React.ReactNode;
  bodyClassName?: string;
}

/** The core terminal building block: a bordered, titled panel. */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
  ...props
}: PanelProps) {
  return (
    <div className={cn("panel", className)} {...props}>
      {(title || action) && (
        <div className="panel-header">
          <span className="panel-title">{title}</span>
          {action}
        </div>
      )}
      <div className={cn("p-3.5", bodyClassName)}>{children}</div>
    </div>
  );
}
