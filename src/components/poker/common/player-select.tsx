"use client"

/**
 * PlayerSelect - Replaced with a shadcn/ui Command + Popover combobox.
 *
 * Previous implementation used a native `<select>` without search support.
 * Now delegates to PlayerCombobox for full search, keyboard navigation,
 * and visual consistency with the shadcn/ui design system.
 *
 * @see PlayerCombobox for detailed prop documentation.
 */

import { PlayerCombobox } from "./player-combobox"

export function PlayerSelect(props: Omit<React.ComponentProps<typeof PlayerCombobox>, "allowCustom" | "allowClear">) {
  return <PlayerCombobox {...props} />
}
