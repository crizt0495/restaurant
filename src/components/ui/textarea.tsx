import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full border-3 border-border bg-background px-4 py-3 text-sm font-medium shadow-[4px_4px_0_0_hsl(var(--brutal-ink))] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[4px_4px_0_0_hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
