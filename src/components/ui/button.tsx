"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-sans text-sm font-semibold leading-none",
    "rounded-lg transition-all duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border border-primary shadow-sm hover:bg-primary-hover active:bg-primary-active hover:shadow-md active:shadow-sm",
        secondary: "bg-secondary text-secondary-foreground border border-secondary-border shadow-sm hover:bg-secondary-hover active:bg-secondary-active hover:shadow-md",
        outline: "bg-card/60 text-foreground border border-border shadow-sm hover:bg-muted hover:border-border active:bg-secondary",
        ghost: "bg-transparent text-foreground border border-transparent hover:bg-muted active:bg-secondary",
        destructive: "bg-destructive text-destructive-foreground border border-destructive shadow-sm hover:bg-destructive/90 active:bg-destructive/80 hover:shadow-md",
        success: "bg-success text-success-foreground border border-success shadow-sm hover:bg-success/90 active:bg-success/80 hover:shadow-md",
        link: "bg-transparent text-primary border border-transparent hover:underline-offset-4 hover:underline text-sm font-medium",
        plain: "bg-transparent text-foreground border border-transparent hover:bg-muted",
      },
      size: {
        default: "h-9 px-4 gap-2",
        sm: "h-8 px-3 text-xs gap-1.5",
        lg: "h-11 px-6 text-base gap-2.5",
        xl: "h-14 px-8 text-lg gap-3",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, loading = false, loadingText = "Memproses...", children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isLoading = loading || disabled

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        aria-busy={loading}
        aria-disabled={isLoading || disabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText}</span>
            <span className="inline-block min-w-[1.5em] text-center">{loadingText}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }