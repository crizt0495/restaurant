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
        <button className="group flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-muted">
          <Avatar className="h-8 w-8 ring-0">
            <AvatarImage src={user?.avatar_url} alt={name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-[13px] font-semibold leading-none">{name}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user?.role}</p>
          </div>
          <ChevronUp className="hidden h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">{name}</span>
            <span className="font-mono text-xs text-muted-foreground">@{user?.username}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" /> Pengaturan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/users">
            <User className="mr-2 h-4 w-4" /> Akun
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}