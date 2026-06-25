"use client"

import { useState, useCallback, useMemo } from "react"
import { CheckIcon, ChevronsUpDownIcon, PlusCircleIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface PlayerComboboxProps {
  /** Full list of known player names for the dropdown */
  players: string[]
  /** Currently selected player name */
  value: string
  /** Called when a player is selected (or cleared with allowClear) */
  onChange: (value: string) => void
  /** Placeholder shown when no selection */
  placeholder?: string
  disabled?: boolean
  className?: string
  /**
   * If true, allows clearing the selection by clicking on the selected item again.
   * Also shows a "clear" option in the dropdown.
   */
  allowClear?: boolean
  /**
   * If true, allows entering custom player names not in the list.
   * Shows "Create" option when typed value doesn't match any player.
   */
  allowCustom?: boolean
  /** Text shown in the empty state when search yields no results */
  emptyText?: string
  /** Placeholder for the search input inside the dropdown */
  searchPlaceholder?: string
}

export function PlayerCombobox({
  players,
  value,
  onChange,
  placeholder = "选择玩家",
  disabled = false,
  className,
  allowClear = false,
  allowCustom = false,
  emptyText = "未找到该玩家",
  searchPlaceholder = "搜索玩家...",
}: PlayerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.localeCompare(b, "zh-CN")),
    [players],
  )

  const handleSelect = useCallback(
    (player: string) => {
      if (player === value && allowClear) {
        onChange("")
      } else {
        onChange(player)
      }
      setOpen(false)
      setSearchQuery("")
    },
    [onChange, value, allowClear],
  )

  const handleCreateCustom = useCallback(() => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim())
      setOpen(false)
      setSearchQuery("")
    }
  }, [onChange, searchQuery])

  const handleClear = useCallback(() => {
    onChange("")
    setOpen(false)
    setSearchQuery("")
  }, [onChange])

  const showCreateOption =
    allowCustom &&
    searchQuery.trim() &&
    !sortedPlayers.some(
      (p) => p.toLowerCase() === searchQuery.trim().toLowerCase(),
    )

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchQuery("")
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={value || placeholder}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-background/80 border-border font-normal h-9",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {sortedPlayers
                .filter(
                  (p) =>
                    !searchQuery.trim() ||
                    p.toLowerCase().includes(searchQuery.trim().toLowerCase()),
                )
                .map((player) => (
                  <CommandItem
                    key={player}
                    value={player}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        value === player ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span>{player}</span>
                  </CommandItem>
                ))}
            </CommandGroup>

            {showCreateOption && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value={searchQuery.trim()}
                    onSelect={handleCreateCustom}
                    className="cursor-pointer text-primary"
                  >
                    <PlusCircleIcon className="mr-2 size-4" />
                    <span>创建 "{searchQuery.trim()}"</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}

            {allowClear && value && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    onSelect={handleClear}
                    className="cursor-pointer text-muted-foreground"
                  >
                    <XIcon className="mr-2 size-4" />
                    <span>清除选择</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
