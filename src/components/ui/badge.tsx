import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-150",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
        secondary:
          "bg-secondary text-secondary-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
        destructive:
          "bg-destructive text-destructive-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
        outline:
          "bg-background text-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
        success:
          "bg-success text-success-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
        warning:
          "bg-warning text-warning-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
        info:
          "bg-info text-info-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
        neutral:
          "bg-muted text-muted-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
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
