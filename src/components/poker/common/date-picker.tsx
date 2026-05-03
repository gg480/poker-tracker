"use client"

import { Input } from "@/components/ui/input"

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-background/80 border-border ${className}`}
    />
  )
}
