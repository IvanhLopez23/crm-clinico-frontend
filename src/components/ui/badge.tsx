import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-brand-50 text-brand-800 ring-brand-200",
        secondary: "bg-canvas text-ink ring-line",
        success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
        warning: "bg-amber-50 text-amber-800 ring-amber-200",
        destructive: "bg-rose-50 text-rose-700 ring-rose-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
