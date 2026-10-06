import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  action?: React.ReactNode;
  bodyClassName?: string;
  soft?: boolean;
}

/** A soft screen card. Title row is optional and understated. */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
  soft,
  ...props
}: CardProps) {
  return (
    <div className={cn(soft ? "card-soft" : "card", className)} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <span className="display text-sm">{title}</span>
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  );
}
