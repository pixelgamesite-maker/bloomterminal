import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("chip", {
  variants: {
    variant: {
      default: "",
      pink: "chip-pink",
      blue: "chip-blue",
      green: "chip-green",
      yellow: "chip-yellow",
      muted: "text-ink-soft",
      up: "chip-green",
      down: "chip-pink",
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
