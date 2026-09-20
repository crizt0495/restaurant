import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, badge, className, children }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 animate-brutal-slide-up", className)}>
      <div>
        {badge && (
          <Badge variant="default" className="mb-2">
            {badge}
          </Badge>
        )}
        <h2 className="font-display text-2xl font-bold tracking-tight leading-none md:text-3xl">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}