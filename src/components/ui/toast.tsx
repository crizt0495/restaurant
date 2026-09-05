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
  default: "border bg-background text-foreground",
  destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  success: "border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-500",
  warning: "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-500",
  info: "border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-500",
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  destructive: <AlertCircle className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
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
          className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <X className="h-4 w-4" />
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
    className={cn("text-sm opacity-90", className)}
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
