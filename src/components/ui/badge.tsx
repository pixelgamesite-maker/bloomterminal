import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("tag", {
  variants: {
    variant: {
      default: "text-ink",
      ink: "bg-ink text-paper border-ink",
      claret: "text-claret",
      up: "text-up",
      down: "text-down",
      muted: "text-ink-soft",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
