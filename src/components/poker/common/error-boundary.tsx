"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  /** 轻量级模式，用于 Tab 级别的兜底 */
  variant?: "full" | "tab"
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * 全局错误边界组件
 *
 * - variant="full": 全屏暗色卡片风格 fallback，含错误信息 + 刷新按钮
 * - variant="tab": 轻量 fallback，仅显示提示文字 + 刷新按钮
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack)
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  private handleRefresh = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      if (this.props.variant === "tab") {
        return (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-border/40 bg-[#0f172a]/60">
            <p className="text-sm text-muted-foreground/70 mb-3">
              出错了，刷新试试
            </p>
            <button
              onClick={this.handleRefresh}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors duration-200"
            >
              刷新
            </button>
          </div>
        )
      }

      // variant="full" — 全局暗色 fallback
      const errorMessage = this.state.error?.message ?? "未知错误"
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <div className="max-w-md w-full bg-[#1e293b]/80 border border-border/40 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="text-5xl mb-4">😵</div>
            <h2 className="text-lg font-bold text-primary mb-2">
              页面出错了
            </h2>
            <p className="text-sm text-muted-foreground/70 mb-2 leading-relaxed">
              发生了意外错误，请尝试刷新页面。
            </p>
            {errorMessage && (
              <p className="text-xs text-muted-foreground/50 mb-6 font-mono bg-black/20 rounded-lg px-3 py-2 break-all select-text">
                {errorMessage}
              </p>
            )}
            <button
              onClick={this.handleRefresh}
              className="px-6 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 shadow-lg shadow-primary/20"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/** Tab 级别轻量错误边界，默认 variant="tab" */
export function TabErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary variant="tab">{children}</ErrorBoundary>
}
