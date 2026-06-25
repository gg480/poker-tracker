import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** 首页骨架：概览卡片 x2 + 快捷操作 + 图表 */
export function HomeSkeleton() {
  return (
    <div
      role="status"
      aria-label="Home page is loading"
      className="space-y-5 animate-in fade-in duration-500"
    >
      {/* 概览卡片 x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* 快捷操作骨架 */}
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 flex-1 rounded-xl" />
        ))}
      </div>

      {/* 图表骨架 */}
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

/** 排行骨架：5 块折叠卡片条状 */
export function RankingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Ranking page is loading"
      className="space-y-3 animate-in fade-in duration-500"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/40"
        >
          {/* 排名序号 */}
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          {/* 玩家名 + 数据 */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          {/* 分数 */}
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </div>
  )
}

/** 手牌骨架：标题 + 列表 */
export function HandSkeleton() {
  return (
    <div
      role="status"
      aria-label="Hand history is loading"
      className="space-y-4 animate-in fade-in duration-500"
    >
      {/* 标题 */}
      <Skeleton className="h-7 w-28" />
      {/* 列表 */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/** 记录页骨架：快速录入 + 场次列表 */
export function RecordSkeleton() {
  return (
    <div
      role="status"
      aria-label="Record page is loading"
      className="space-y-5 animate-in fade-in duration-500"
    >
      {/* 快速录入区域 */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
        <Skeleton className="h-5 w-20" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      {/* 场次列表标题 */}
      <Skeleton className="h-5 w-24" />
      {/* 场次列表 */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/** 个人页骨架：个人信息 + 设置项 */
export function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-label="Profile page is loading"
      className="space-y-5 animate-in fade-in duration-500"
    >
      {/* 个人信息卡片 */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-5 space-y-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* 设置项列表 */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/** 赛季报告骨架：统计卡片 + 趋势图 + 奖项区 */
export function SeasonReportSkeleton() {
  return (
    <div
      role="status"
      aria-label="Season report is loading"
      className="space-y-5 animate-in fade-in duration-500"
    >
      {/* 顶部统计卡片 x4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* 趋势图 */}
      <Skeleton className="h-72 w-full rounded-xl" />

      {/* 奖项区 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/** AI 分析骨架：对话 + 建议卡片 */
export function AiAnalysisSkeleton() {
  return (
    <div
      role="status"
      aria-label="AI analysis is loading"
      className="space-y-4 animate-in fade-in duration-500"
    >
      {/* 对话气泡 */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              i % 2 === 0 ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "space-y-2 rounded-xl p-4 max-w-[80%]",
                i % 2 === 0
                  ? "bg-card/50 border border-border/40"
                  : "bg-primary/10"
              )}
            >
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>

      {/* 建议卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/** 教练页骨架：棋盘 + 操作区 + 建议面板 */
export function CoachSkeleton() {
  return (
    <div
      role="status"
      aria-label="Coach page is loading"
      className="space-y-5 animate-in fade-in duration-500"
    >
      {/* 棋盘区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/* ─── 内部子组件 ─── */

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-5 space-y-3">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-40" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}
