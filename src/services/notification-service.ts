/**
 * @deprecated This service has no active consumers as of 2026-06-25. Keep for future use or remove if unused after 2026-09-25.
 */

import type { ClearRadarAlert } from "@/lib/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

// ========================================================================
// Types
// ========================================================================

export type NotificationLevel = "info" | "warning" | "error" | "success"
export type NotificationCategory =
  | "clear_radar"
  | "settlement"
  | "award"
  | "session"
  | "system"

export interface AppNotification {
  id: string
  category: NotificationCategory
  level: NotificationLevel
  title: string
  message: string
  timestamp: number
  read: boolean
  dismissed: boolean
  metadata?: Record<string, unknown>
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<NotificationCategory, number>
  byLevel: Record<NotificationLevel, number>
}

export type NotificationSortField = "timestamp" | "level" | "category"
export type NotificationSortOrder = "asc" | "desc"

export interface NotificationFilter {
  category?: NotificationCategory
  level?: NotificationLevel
  read?: boolean
  dismissed?: boolean
  search?: string
}

// ========================================================================
// Constants
// ========================================================================

const MAX_NOTIFICATIONS = 100

const LEVEL_ORDER: Record<NotificationLevel, number> = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
}

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  clear_radar: "清分提醒",
  settlement: "结算通知",
  award: "成就通知",
  session: "场次通知",
  system: "系统通知",
}

// ========================================================================
// ID Generation
// ========================================================================

function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ========================================================================
// Factory Functions
// ========================================================================

const ALERT_LEVEL_MAP: Record<string, NotificationLevel> = {
  trigger: "error",
  reminder: "warning",
  alert: "warning",
  none: "info",
}

/**
 * 从 ClearRadarAlert 创建通知
 * 自动去重：相同 player + seasonId 的 trigger/alert 通知不重复创建
 */
export function createClearRadarNotification(alert: ClearRadarAlert): AppNotification {
  return {
    id: generateId(),
    category: "clear_radar",
    level: ALERT_LEVEL_MAP[alert.level] ?? "info",
    title: `清分提醒 - ${alert.player}`,
    message: alert.message,
    timestamp: Date.now(),
    read: false,
    dismissed: false,
    metadata: {
      player: alert.player,
      seasonId: alert.seasonId,
      balance: alert.balance,
      threshold: alert.threshold,
      level: alert.level,
    },
  }
}

/**
 * 从多个 ClearRadarAlert 批量创建通知（自动去重）
 */
export function createClearRadarNotifications(
  alerts: ClearRadarAlert[]
): AppNotification[] {
  return alerts.map(createClearRadarNotification)
}

// ========================================================================
// CRUD Utilities
// ========================================================================

/**
 * 添加通知，自动去重：clear_radar 类型按 player+seasonId 去重
 */
export function addNotification(
  notifications: AppNotification[],
  notification: AppNotification
): AppNotification[] {
  if (notification.category === "clear_radar") {
    const meta = notification.metadata as
      | { player?: string; seasonId?: string }
      | undefined
    if (meta?.player && meta?.seasonId) {
      const exists = notifications.some(
        (n) =>
          !n.dismissed &&
          n.category === "clear_radar" &&
          (n.metadata as { player?: string; seasonId?: string } | undefined)
            ?.player === meta.player &&
          (n.metadata as { player?: string; seasonId?: string } | undefined)
            ?.seasonId === meta.seasonId
      )
      if (exists) return notifications
    }
  }

  return [notification, ...notifications].slice(0, MAX_NOTIFICATIONS)
}

/**
 * 批量添加通知
 */
export function addNotifications(
  notifications: AppNotification[],
  newNotifications: AppNotification[]
): AppNotification[] {
  let result = notifications
  for (const n of newNotifications) {
    result = addNotification(result, n)
  }
  return result
}

/**
 * 标记通知为已读
 */
export function markAsRead(
  notifications: AppNotification[],
  id: string
): AppNotification[] {
  return notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
}

/**
 * 标记所有通知为已读
 */
export function markAllAsRead(
  notifications: AppNotification[]
): AppNotification[] {
  return notifications.map((n) => ({ ...n, read: true }))
}

/**
 * 标记所有 clear_radar 通知为已读
 */
export function markClearRadarAsRead(
  notifications: AppNotification[]
): AppNotification[] {
  return notifications.map((n) =>
    n.category === "clear_radar" && !n.read ? { ...n, read: true } : n
  )
}

/**
 * 忽略（关闭）通知，保留在历史中
 */
export function dismissNotification(
  notifications: AppNotification[],
  id: string
): AppNotification[] {
  return notifications.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
}

/**
 * 永久删除通知
 */
export function removeNotification(
  notifications: AppNotification[],
  id: string
): AppNotification[] {
  return notifications.filter((n) => n.id !== id)
}

/**
 * 清除所有已忽略的通知
 */
export function clearDismissed(
  notifications: AppNotification[]
): AppNotification[] {
  return notifications.filter((n) => !n.dismissed)
}

/**
 * 清空所有通知
 */
export function clearAll(
  _notifications: AppNotification[]
): AppNotification[] {
  return []
}

// ========================================================================
// Query Utilities
// ========================================================================

/**
 * 获取活跃（未忽略）的通知，按时间倒序
 */
export function getActiveNotifications(
  notifications: AppNotification[]
): AppNotification[] {
  return notifications
    .filter((n) => !n.dismissed)
    .sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * 获取未读通知
 */
export function getUnreadNotifications(
  notifications: AppNotification[]
): AppNotification[] {
  return getActiveNotifications(notifications).filter((n) => !n.read)
}

/**
 * 获取未读数量
 */
export function getUnreadCount(notifications: AppNotification[]): number {
  let count = 0
  for (const n of notifications) {
    if (!n.dismissed && !n.read) count++
  }
  return count
}

/**
 * 按分类过滤
 */
export function getNotificationsByCategory(
  notifications: AppNotification[],
  category: NotificationCategory
): AppNotification[] {
  return getActiveNotifications(notifications).filter(
    (n) => n.category === category
  )
}

/**
 * 按级别过滤
 */
export function getNotificationsByLevel(
  notifications: AppNotification[],
  level: NotificationLevel
): AppNotification[] {
  return getActiveNotifications(notifications).filter((n) => n.level === level)
}

/**
 * 排序通知
 */
export function sortNotifications(
  notifications: AppNotification[],
  field: NotificationSortField = "timestamp",
  order: NotificationSortOrder = "desc"
): AppNotification[] {
  return [...notifications].sort((a, b) => {
    let cmp = 0
    switch (field) {
      case "timestamp":
        cmp = a.timestamp - b.timestamp
        break
      case "level":
        cmp = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
        break
      case "category":
        cmp = a.category.localeCompare(b.category)
        break
    }
    return order === "desc" ? -cmp : cmp
  })
}

/**
 * 过滤通知（支持多条件组合）
 */
export function filterNotifications(
  notifications: AppNotification[],
  filter: NotificationFilter
): AppNotification[] {
  return notifications.filter((n) => {
    if (filter.category !== undefined && n.category !== filter.category)
      return false
    if (filter.level !== undefined && n.level !== filter.level) return false
    if (filter.read !== undefined && n.read !== filter.read) return false
    if (filter.dismissed !== undefined && n.dismissed !== filter.dismissed)
      return false
    if (filter.search) {
      const q = filter.search.toLowerCase()
      if (
        !n.title.toLowerCase().includes(q) &&
        !n.message.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })
}

/**
 * 统计通知
 */
export function computeNotificationStats(
  notifications: AppNotification[]
): NotificationStats {
  const active = getActiveNotifications(notifications)

  const byCategory: Record<NotificationCategory, number> = {
    clear_radar: 0,
    settlement: 0,
    award: 0,
    session: 0,
    system: 0,
  }

  const byLevel: Record<NotificationLevel, number> = {
    info: 0,
    warning: 0,
    error: 0,
    success: 0,
  }

  for (const n of active) {
    byCategory[n.category] = (byCategory[n.category] ?? 0) + 1
    byLevel[n.level] = (byLevel[n.level] ?? 0) + 1
  }

  return {
    total: active.length,
    unread: active.filter((n) => !n.read).length,
    byCategory,
    byLevel,
  }
}

// ========================================================================
// Format Helpers
// ========================================================================

/**
 * 获取通知分类的中文标签
 */
export function getCategoryLabel(category: NotificationCategory): string {
  return CATEGORY_LABELS[category] ?? category
}

/**
 * 格式化时间戳为相对时间（如"3分钟前"）
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(timestamp).toLocaleDateString("zh-CN")
}

/**
 * 获取通知级别的图标名称（与 lucide-react 兼容）
 */
export function getLevelIcon(level: NotificationLevel): string {
  switch (level) {
    case "error":
      return "OctagonX"
    case "warning":
      return "TriangleAlert"
    case "success":
      return "CircleCheck"
    case "info":
      return "Info"
  }
}

/**
 * 获取通知级别的颜色类名
 */
export function getLevelColor(level: NotificationLevel): string {
  switch (level) {
    case "error":
      return "text-red-500"
    case "warning":
      return "text-amber-500"
    case "success":
      return "text-emerald-500"
    case "info":
      return "text-blue-500"
  }
}

/**
 * 获取通知级别的背景类名
 */
export function getLevelBg(level: NotificationLevel): string {
  switch (level) {
    case "error":
      return "bg-red-500/10"
    case "warning":
      return "bg-amber-500/10"
    case "success":
      return "bg-emerald-500/10"
    case "info":
      return "bg-blue-500/10"
  }
}

// ========================================================================
// ClearRadar Integration
// ========================================================================

/**
 * 比较新旧 alerts 列表，返回新增的 alert
 * 用于增量通知：只对新增的 trigger/reminder 级别发出通知
 */
export function diffNewAlerts(
  oldAlerts: ClearRadarAlert[],
  newAlerts: ClearRadarAlert[]
): ClearRadarAlert[] {
  const oldSet = new Set(
    oldAlerts.map((a) => `${a.player}-${a.seasonId}-${a.level}`)
  )
  return newAlerts.filter(
    (a) =>
      (a.level === "trigger" || a.level === "reminder") &&
      !oldSet.has(`${a.player}-${a.seasonId}-${a.level}`)
  )
}

/**
 * 序列化通知列表（用于 toast 的 message 聚合）
 * 将多条通知汇总为一条摘要文本
 */
export function summarizeNotifications(
  notifications: AppNotification[]
): string {
  if (notifications.length === 0) return ""
  if (notifications.length === 1) return notifications[0].message

  const byLevel = notifications.reduce(
    (acc, n) => {
      acc[n.level] = (acc[n.level] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const parts: string[] = []
  if (byLevel.error) parts.push(`${byLevel.error} 条紧急`)
  if (byLevel.warning) parts.push(`${byLevel.warning} 条提醒`)
  if (byLevel.info) parts.push(`${byLevel.info} 条信息`)
  if (byLevel.success) parts.push(`${byLevel.success} 条成功`)

  return `您有 ${notifications.length} 条新通知：${parts.join("，")}`
}

// ========================================================================
// Zustand Store
// ========================================================================

interface NotificationState {
  /** 所有通知（含已忽略的） */
  notifications: AppNotification[]
  /** 上次检查 ClearRadar 时的 alerts 快照（用于增量检测） */
  lastAlerts: ClearRadarAlert[]
  /** 是否已初始化 Sonner toast */
  _toastReady: boolean
}

interface NotificationActions {
  /** 添加一条通知 */
  add: (notification: AppNotification) => void
  /** 批量添加通知 */
  addMany: (notifications: AppNotification[]) => void
  /** 标记为已读 */
  markRead: (id: string) => void
  /** 标记全部已读 */
  markAllRead: () => void
  /** 标记所有清分雷达通知为已读 */
  markClearRadarRead: () => void
  /** 忽略（关闭）通知 */
  dismiss: (id: string) => void
  /** 永久删除通知 */
  remove: (id: string) => void
  /** 清除所有已忽略的通知 */
  clearDismissed: () => void
  /** 清空所有通知 */
  clearAll: () => void
  /** 获取未读数量 */
  unreadCount: () => number
  /** 获取活跃通知列表 */
  active: () => AppNotification[]
  /** 获取统计 */
  stats: () => NotificationStats
  /** 保存检查 ClearRadar 时的 alert 快照 */
  captureAlerts: (alerts: ClearRadarAlert[]) => void
  /** 获取上次 alert 快照 */
  getLastAlerts: () => ClearRadarAlert[]
}

const initialState: NotificationState = {
  notifications: [],
  lastAlerts: [],
  _toastReady: true,
}

export const useNotificationStore = create<
  NotificationState & NotificationActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      add: (notification) =>
        set((state) => ({
          notifications: addNotification(state.notifications, notification),
        })),

      addMany: (notifications) =>
        set((state) => ({
          notifications: addNotifications(state.notifications, notifications),
        })),

      markRead: (id) =>
        set((state) => ({
          notifications: markAsRead(state.notifications, id),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: markAllAsRead(state.notifications),
        })),

      markClearRadarRead: () =>
        set((state) => ({
          notifications: markClearRadarAsRead(state.notifications),
        })),

      dismiss: (id) =>
        set((state) => ({
          notifications: dismissNotification(state.notifications, id),
        })),

      remove: (id) =>
        set((state) => ({
          notifications: removeNotification(state.notifications, id),
        })),

      clearDismissed: () =>
        set((state) => ({
          notifications: clearDismissed(state.notifications),
        })),

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => getUnreadCount(get().notifications),

      active: () => getActiveNotifications(get().notifications),

      stats: () => computeNotificationStats(get().notifications),

      captureAlerts: (alerts) => set({ lastAlerts: alerts }),

      getLastAlerts: () => get().lastAlerts,
    }),
    {
      name: "poker-notification-store",
      partialize: (state) => ({
        notifications: state.notifications,
        lastAlerts: state.lastAlerts,
      }),
    }
  )
)

// ========================================================================
// Toast Dispatcher
// ========================================================================

/**
 * 向 Sonner toast 发送通知
 * 由组件在 useEffect 中按需调用，而非服务主动触发
 */
export function getToastPayload(notification: AppNotification): {
  message: string
  description?: string
  level: "success" | "info" | "warning" | "error"
} {
  const levelMap: Record<string, "success" | "info" | "warning" | "error"> = {
    success: "success",
    info: "info",
    warning: "warning",
    error: "error",
  }

  return {
    message: notification.title,
    description: notification.message,
    level: levelMap[notification.level] ?? "info",
  }
}

/**
 * 从 ClearRadarAlerts 中检测新增的 trigger/reminder 通知并返回
 * 纯函数：不产生副作用，供组件在 effect 中消费
 */
export function detectNewClearRadarNotifications(
  currentAlerts: ClearRadarAlert[],
  lastAlerts: ClearRadarAlert[]
): AppNotification[] {
  const newAlerts = diffNewAlerts(lastAlerts, currentAlerts)
  if (newAlerts.length === 0) return []
  return createClearRadarNotifications(newAlerts)
}
