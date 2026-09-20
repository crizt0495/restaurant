import * as React from "react"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "default" | "destructive" | "success" | "warning" | "info"

interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant
  onClose?: () => void
}

const variantStyles: Record<ToastVariant, string> = {
  default: "bg-card text-card-foreground border-border",
  destructive: "bg-destructive text-destructive-foreground border-destructive",
  success: "bg-success text-success-foreground border-success",
  warning: "bg-warning text-warning-foreground border-warning",
  info: "bg-info text-info-foreground border-info",
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  destructive: <AlertCircle className="h-5 w-5" strokeWidth={2} />,
  success: <CheckCircle2 className="h-5 w-5" strokeWidth={2} />,
  warning: <AlertTriangle className="h-5 w-5" strokeWidth={2} />,
  info: <Info className="h-5 w-5" strokeWidth={2} />,
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "pointer-events-auto relative flex w-full items-center gap-3 rounded-xl border p-4 pr-10 shadow-lg transition-all font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variantIcons[variant] && (
        <div className="shrink-0">{variantIcons[variant]}</div>
      )}
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  )
)
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-semibold [&+div]:text-xs", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm opacity-90 font-medium", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

let toastCount = 0
const listeners: Array<(toasts: ToastData[]) => void> = []
let memoryToasts: ToastData[] = []

function dispatch(newToasts: ToastData[]) {
  memoryToasts = newToasts
  listeners.forEach((listener) => listener(memoryToasts))
}

function toast({ title, description, variant = "default" }: Omit<ToastData, "id">) {
  const id = String(++toastCount)
  const newToast: ToastData = { id, title, description, variant }
  dispatch([...memoryToasts, newToast])

  return {
    id,
    dismiss: () => {
      memoryToasts = memoryToasts.filter((t) => t.id !== id)
      dispatch(memoryToasts)
    },
  }
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>(memoryToasts)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const idx = listeners.indexOf(setToasts)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss: (id: string) => {
      dispatch(memoryToasts.filter((t) => t.id !== id))
    },
  }
}

export { Toast, ToastTitle, ToastDescription, toast, useToast }
export type { ToastData, ToastVariant }