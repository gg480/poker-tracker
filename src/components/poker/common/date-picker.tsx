"use client"

import { useCallback } from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  /** ISO date string (YYYY-MM-DD) — 与原生 input[type=date] 行为一致 */
  value: string
  /** 回调接收 YYYY-MM-DD 格式字符串，清空时传入 "" */
  onChange: (value: string) => void
  className?: string
  /** 未选择日期时占位文案，默认 "选择日期" */
  placeholder?: string
  /** 是否显示清除按钮，默认 true */
  clearable?: boolean
  /** 禁用整个 date-picker，默认 false */
  disabled?: boolean
}

/**
 * 使用 Popover + Calendar 的日期选择器，替换原生 `<input type="date">`。
 *
 * 接口兼容原生 input[type=date]：
 *  - `value` 为 "YYYY-MM-DD" 字符串
 *  - `onChange` 接收 "YYYY-MM-DD" 字符串
 *
 * 显示格式：中文全日期（如 "2025年10月26日"）。
 */
export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "选择日期",
  clearable = true,
  disabled = false,
}: DatePickerProps) {
  const date = value ? parseISODate(value) : undefined

  const handleSelect = useCallback(
    (selected: Date | undefined) => {
      if (!selected) {
        onChange("")
        return
      }
      // 格式化为 YYYY-MM-DD 以保持与原生 input[type=date] 相同的 value 格式
      onChange(format(selected, "yyyy-MM-dd"))
    },
    [onChange],
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange("")
    },
    [onChange],
  )

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">
            {date ? formatFullDate(date) : placeholder}
          </span>
          {clearable && value && (
            <X
              className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/60 hover:text-muted-foreground"
              onClick={handleClear}
              aria-hidden="true"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// ---------- helpers ----------

/** 将 "YYYY-MM-DD" 字符串解析为 Date（按 UTC 零时区避免时区偏移） */
function parseISODate(iso: string): Date | undefined {
  try {
    // 用正则确保格式正确，避免 new Date("2025-10-26") 被当作 UTC 而导致 toLocaleDateString 产生日期偏移
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return undefined
    const [, y, m, d] = match
    // 月份从 0 开始
    return new Date(+y, +m - 1, +d)
  } catch {
    return undefined
  }
}

/** 将 Date 格式化为中文完整日期 */
function formatFullDate(d: Date): string {
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
