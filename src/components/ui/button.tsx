import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-md font-semibold focus-visible:outline-3 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled disabled:opacity-100",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary shadow-sm hover:bg-primary/90 focus-visible:outline-focus-ring",
        ghost:
          "bg-transparent text-foreground hover:bg-surface-muted focus-visible:outline-focus-ring",
      },
      size: {
        default: "px-5 py-2.5",
        compact: "px-3 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
}
