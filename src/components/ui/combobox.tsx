"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export interface ComboboxOption {
  value: string
  label: string
  hint?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyText = "Tidak ada hasil",
  disabled = false,
  className,
  ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => setMounted(true), [])

  const selected = options.find((o) => o.value === value)

  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      o.label.toLowerCase().includes(q) ||
      ((o.hint || "").toLowerCase().includes(q))
    )
  })

  return (
    <Popover open={open && mounted} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between rounded-lg border-input bg-card px-3.5 font-normal text-sm text-foreground shadow-sm hover:bg-card hover:border-border",
            !selected && "text-muted-foreground",
            className
          )}
        >
          {selected ? (
            <span className="truncate">{selected.label}</span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={6}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    setQuery("")
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}