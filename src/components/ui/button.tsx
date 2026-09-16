"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-sans text-sm font-medium leading-none",
    "rounded-md transition-all duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border border-primary hover:bg-primary-hover active:bg-primary-active shadow-elev-1 hover:shadow-elev-hover-1 active:shadow-elev-1",
        secondary: "bg-secondary text-secondary-foreground border border-secondary-border hover:bg-secondary-hover active:bg-secondary-active shadow-elev-1 hover:shadow-elev-hover-1",
        outline: "bg-transparent text-foreground border border-border hover:bg-secondary active:bg-secondary-border",
        ghost: "bg-transparent text-foreground border border-transparent hover:bg-secondary active:bg-secondary-active",
        destructive: "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 active:bg-destructive shadow-elev-1 hover:shadow-elev-hover-1",
        success: "bg-success text-success-foreground border border-success hover:bg-success/90 active:bg-success/80 shadow-elev-1 hover:shadow-elev-hover-1",
        link: "bg-transparent text-primary border border-transparent hover:underline-offset-4 hover:underline text-sm font-medium",
        plain: "bg-transparent text-foreground border border-transparent hover:bg-secondary",
      },
      size: {
        default: "h-10 px-4 gap-2",
        sm: "h-8 px-3 text-xs gap-1.5",
        lg: "h-12 px-6 text-base gap-2.5",
        xl: "h-14 px-8 text-lg gap-3",
        icon: "h-10 w-10 p-0",
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
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, loading = false, loadingText = "Memproses...", children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isLoading = loading || disabled;

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
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };