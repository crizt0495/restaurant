"use client"

import { signOut } from "@/lib/actions/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User, ChevronUp } from "lucide-react"
import Link from "next/link"

interface UserMenuProps {
  user?: {
    full_name: string
    role: string
    username: string
    avatar_url?: string
  } | null
}

export function UserMenu({ user }: UserMenuProps) {
  const name = user?.full_name ?? "Pengguna"
  const initials = getInitials(name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex w-full items-center gap-2.5 border-2 border-foreground bg-background p-1.5 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_hsl(var(--primary))]">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block flex-1 min-w-0">
            <p className="text-xs font-black uppercase leading-none truncate">{name}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{user?.role}</p>
          </div>
          <ChevronUp className="h-4 w-4 hidden sm:block transition-transform group-data-[state=open]:rotate-180" strokeWidth={3} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="font-black uppercase tracking-wide">{name}</span>
            <span className="text-[10px] font-mono font-bold text-muted-foreground">@{user?.username}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" strokeWidth={3} /> Pengaturan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/users">
            <User className="mr-2 h-4 w-4" strokeWidth={3} /> Akun
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
          <LogOut className="mr-2 h-4 w-4" strokeWidth={3} /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
