import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border border-primary/15",
        secondary:
          "bg-secondary text-secondary-foreground border border-border",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/15",
        outline:
          "bg-transparent text-muted-foreground border border-border",
        success:
          "bg-success/10 text-success border border-success/15",
        warning:
          "bg-warning/10 text-warning border border-warning/15",
        info:
          "bg-info/10 text-info border border-info/15",
        neutral:
          "bg-muted text-muted-foreground border border-border",
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
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }