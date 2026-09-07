import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider border-2 transition-all duration-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-border shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]",
        secondary:
          "bg-secondary text-secondary-foreground border-border shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]",
        destructive:
          "bg-destructive text-destructive-foreground border-border shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]",
        outline:
          "bg-background text-foreground border-border shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]",
        success:
          "bg-success text-success-foreground border-border shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]",
        warning:
          "bg-warning text-warning-foreground border-border shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]",
        info:
          "bg-info text-info-foreground border-border shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]",
        neutral:
          "bg-muted text-muted-foreground border-border shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), "px-2.5 py-1", className)} {...props} />
  )
}

export { Badge, badgeVariants }
