import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink", {
  variants: {
    variant: {
      default: "",
      pink: "btn-pink",
      blue: "btn-blue",
      yellow: "btn-yellow",
      green: "btn-green",
    },
    size: {
      sm: "h-9 px-3 text-xs",
      md: "h-11 px-4 text-sm",
      lg: "h-14 px-7 text-base",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";
