import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border-3 border-border bg-background px-4 py-2 text-sm font-medium shadow-[4px_4px_0_0_hsl(var(--brutal-ink))] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[4px_4px_0_0_hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted transition-all duration-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
