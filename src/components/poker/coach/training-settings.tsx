"use client"

import { useState, useCallback } from "react"
import { useCoachStore } from "@/stores/coach-store"
import type { OpponentStyle } from "@/lib/coach/types"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const OPPONENT_STYLES: { value: OpponentStyle; label: string; desc: string }[] = [
  { value: "gto", label: "GTO", desc: "最优策略对手" },
  { value: "aggressive", label: "激进", desc: "高频加注、进攻性强" },
  { value: "passive", label: "被动", desc: "偏向跟注、攻击性低" },
]

const POSITIONS = [
  { value: "BTN", label: "BTN", desc: "按钮位" },
  { value: "CO", label: "CO", desc: "关煞位" },
  { value: "HJ", label: "HJ", desc: "劫位" },
  { value: "LJ", label: "LJ", desc: "枪口+1" },
  { value: "UTG", label: "UTG", desc: "枪口位" },
  { value: "BB", label: "BB", desc: "大盲位" },
] as const

export function TrainingSettings() {
  const { setSettings, createSession } = useCoachStore()

  // 表单状态
  const [opponentStyle, setOpponentStyle] = useState<OpponentStyle>("gto")
  const [stackBB, setStackBB] = useState(100)
  const [blindSmall, setBlindSmall] = useState(1)
  const [blindBig, setBlindBig] = useState(2)
  const [position, setPosition] = useState("BTN")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [starting, setStarting] = useState(false)

  // 实时计算绝对值
  const absoluteStack = stackBB * blindBig

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!Number.isInteger(Number(stackBB)) || stackBB < 1) {
      newErrors.stackBB = "请输入正整数"
    }
    if (!Number.isInteger(Number(blindSmall)) || blindSmall < 1) {
      newErrors.blindSmall = "请输入正整数"
    }
    if (!Number.isInteger(Number(blindBig)) || blindBig < 1) {
      newErrors.blindBig = "请输入正整数"
    }
    if (blindBig <= blindSmall) {
      newErrors.blindBig = "大盲必须大于小盲"
    }
    if (absoluteStack <= blindBig) {
      newErrors.stackBB = "筹码量必须大于大盲注"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [stackBB, blindSmall, blindBig, absoluteStack])

  const handleStart = useCallback(() => {
    if (!validate()) return
    setStarting(true)

    setSettings({
      opponentStyle,
      startingStack: absoluteStack,
      blindSmall,
      blindBig,
      mode: "cash",
    })

    // 延迟一小段时间让设置生效，然后创建会话
    setTimeout(() => {
      createSession()
      setStarting(false)
    }, 100)
  }, [validate, opponentStyle, absoluteStack, blindSmall, blindBig, setSettings, createSession])

  return (
    <div className="max-w-lg mx-auto space-y-6 py-6">
      {/* 标题 */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold font-display">AI 德州扑克教练</h1>
        <p className="text-xs text-muted-foreground/60">配置训练参数，开始智能对局</p>
      </div>

      {/* 对手风格 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">对手风格</CardTitle>
          <CardDescription>选择 AI 对手的玩法风格</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {OPPONENT_STYLES.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setOpponentStyle(style.value)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                  opponentStyle === style.value
                    ? "border-primary/40 bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "border-border/40 bg-card/50 text-muted-foreground/70 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <div className="text-sm font-semibold">{style.label}</div>
                <div className="text-[10px] mt-0.5 opacity-60">{style.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 位置选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">位置</CardTitle>
          <CardDescription>你将在哪个位置开始</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择位置" />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  <span className="font-semibold">{pos.label}</span>
                  <span className="text-muted-foreground/60 ml-2">- {pos.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 筹码与盲注 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">筹码与盲注</CardTitle>
          <CardDescription>设置起始筹码量和盲注级别</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 起始筹码 */}
          <div className="space-y-2">
            <Label htmlFor="stackBB">起始筹码 (BB)</Label>
            <Input
              id="stackBB"
              type="number"
              min={1}
              value={stackBB}
              onChange={(e) => setStackBB(Number(e.target.value))}
              data-invalid={!!errors.stackBB || undefined}
            />
            {errors.stackBB && (
              <p className="text-[10px] text-red-400">{errors.stackBB}</p>
            )}
            <p className="text-[10px] text-muted-foreground/50">
              实际筹码量: {absoluteStack.toLocaleString()}
            </p>
          </div>

          {/* 盲注 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="blindSmall">小盲 (SB)</Label>
              <Input
                id="blindSmall"
                type="number"
                min={1}
                value={blindSmall}
                onChange={(e) => setBlindSmall(Number(e.target.value))}
                data-invalid={!!errors.blindSmall || undefined}
              />
              {errors.blindSmall && (
                <p className="text-[10px] text-red-400">{errors.blindSmall}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="blindBig">大盲 (BB)</Label>
              <Input
                id="blindBig"
                type="number"
                min={2}
                value={blindBig}
                onChange={(e) => setBlindBig(Number(e.target.value))}
                data-invalid={!!errors.blindBig || undefined}
              />
              {errors.blindBig && (
                <p className="text-[10px] text-red-400">{errors.blindBig}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 汇总信息 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground/70">
            <span>盲注结构</span>
            <span className="font-mono font-semibold text-foreground">
              {blindSmall}/{blindBig}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground/70 mt-1">
            <span>有效筹码</span>
            <span className="font-mono font-semibold text-foreground">
              {stackBB} BB ({absoluteStack.toLocaleString()} chips)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground/70 mt-1">
            <span>对手风格</span>
            <span className="font-semibold text-foreground">
              {OPPONENT_STYLES.find((s) => s.value === opponentStyle)?.label}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground/70 mt-1">
            <span>你的位置</span>
            <span className="font-semibold text-foreground">{position}</span>
          </div>
        </CardContent>
      </Card>

      {/* 开始按钮 */}
      <Button
        size="lg"
        className="w-full h-12 text-base font-bold"
        onClick={handleStart}
        loading={starting}
        disabled={starting}
      >
        开始训练
      </Button>
    </div>
  )
}
