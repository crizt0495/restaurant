import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-muted border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]", className)}
      {...props}
    />
  )
}

export { Skeleton }
