"use client"

import type { ReactNode } from "react"
import { ErrorBoundary } from "@/components/poker/common/error-boundary"

/**
 * 全局 ErrorBoundary 包装组件
 *
 * 用于 Server Component（layout.tsx）中包裹 children，
 * 提供整个应用的错误兜底。
 */
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return <ErrorBoundary variant="full">{children}</ErrorBoundary>
}
