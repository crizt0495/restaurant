import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, badge, className, children }: PageHeaderProps) {
  if (badge) {
    return (
      <div className={cn("flex items-end justify-between animate-brutal-slide-up", className)}>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="bg-primary px-2 py-0.5 text-[10px] font-black font-mono text-primary-foreground">
              {badge}
            </span>
            <span className="h-[3px] w-14 bg-foreground" />
          </div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">{title}</h2>
          {description && (
            <p className="mt-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className={cn("flex items-end justify-between animate-brutal-slide-up", className)}>
      <div>
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}