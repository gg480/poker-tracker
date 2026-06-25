"use client"

import { useCallback, useMemo, useState } from "react"
import { useCoachStore } from "@/stores/coach-store"
import { BoardArea } from "./board-area"
import { HoleCards } from "./hole-cards"
import { PotDisplay } from "./pot-display"
import { ActionButtons } from "./action-buttons"
import { EquityDisplay } from "./equity-display"
import { OpponentInfo } from "./opponent-info"
import { HandHistory } from "./hand-history"
import type { UserAction as PlayerAction } from "@/lib/types"

interface TrainingTableProps {
  onEndSession: () => void
}

export function TrainingTable({ onEndSession }: TrainingTableProps) {
  const {
    currentSession, handNumber, street, potSize,
    userStack, opponentStack, holeCards, boardCards,
    isUserTurn, isHandComplete, handResult, netChips,
    decisions, feedbacks, settings,
    dealNewHand, recordDecision, nextHand, advanceStreet,
    endSession, getCurrentAdvice, getCurrentEquity, getPotOdds, getCurrentEV,
  } = useCoachStore()

  const [showHistory, setShowHistory] = useState(false)

  const advice = useMemo(() => {
    if (holeCards.length === 0 || !isUserTurn) return null
    return getCurrentAdvice()
  }, [holeCards, isUserTurn, getCurrentAdvice])

  const equity = useMemo(() => {
    if (holeCards.length === 0) return 0
    return getCurrentEquity()
  }, [holeCards, boardCards, getCurrentEquity])

  const potOdds = useMemo(() => {
    if (potSize === 0) return 0
    return getPotOdds()
  }, [potSize, getPotOdds])

  const ev = useMemo(() => {
    if (holeCards.length === 0) return 0
    return getCurrentEV()
  }, [holeCards, boardCards, potSize, getCurrentEV])

  const lastFeedback = useMemo(() => {
    if (feedbacks.length === 0) return null
    return feedbacks[feedbacks.length - 1]
  }, [feedbacks])

  const lastOpponentAction = useMemo(() => {
    if (decisions.length === 0) return null
    const lastDec = decisions[decisions.length - 1]
    if (!lastDec.opponentAction) return null
    return { action: lastDec.opponentAction as PlayerAction, betAmount: lastDec.opponentBetAmount }
  }, [decisions])

  const callAmount = useMemo(() => {
    const lastDec = decisions[decisions.length - 1]
    if (!lastDec) return 0
    return Math.max(0, lastDec.opponentBetAmount - lastDec.userBetAmount)
  }, [decisions])

  const canCheck = useMemo(() => callAmount === 0, [callAmount])

  const minRaise = useMemo(() => Math.max(settings.blindBig, callAmount * 2), [settings.blindBig, callAmount])
  const maxRaise = useMemo(() => userStack, [userStack])

  const handleAction = useCallback((action: PlayerAction, betAmount: number) => {
    recordDecision(action, betAmount)
  }, [recordDecision])

  const handleDealNew = useCallback(() => {
    dealNewHand()
  }, [dealNewHand])

  const handleNextHand = useCallback(() => {
    nextHand()
    // 自动发下一手
    setTimeout(() => dealNewHand(), 100)
  }, [nextHand, dealNewHand])

  const handleAdvanceStreet = useCallback(() => {
    advanceStreet()
  }, [advanceStreet])

  const handleEndSession = useCallback(() => {
    endSession("complete")
    onEndSession()
  }, [endSession, onEndSession])

  const handleAbandon = useCallback(() => {
    endSession("abandon")
    onEndSession()
  }, [endSession, onEndSession])

  // 未开始：显示发牌按钮
  if (handNumber === 0 || holeCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-muted-foreground">训练准备就绪</h2>
          <p className="text-xs text-muted-foreground/50">
            Cash Game | 盲注 {settings.blindSmall}/{settings.blindBig} | 起始筹码 {settings.startingStack.toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleDealNew}
          className="px-8 py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
        >
          发牌开始
        </button>
        <button
          onClick={handleAbandon}
          className="px-4 py-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
        >
          放弃训练
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 牌桌区域 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        {/* 绿色牌桌背景 */}
        <div className="relative w-full max-w-lg aspect-[4/3] rounded-[40%] bg-gradient-to-b from-green-800/60 to-green-900/60 border-2 border-green-700/50 shadow-xl flex flex-col items-center justify-center gap-3 p-6">
          {/* 对手信息 - 上方 */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <OpponentInfo
              stack={opponentStack}
              style={settings.opponentStyle}
              lastAction={lastOpponentAction}
              handNumber={handNumber}
            />
          </div>

          {/* 公共牌 */}
          <div className="mt-4">
            <BoardArea cards={boardCards} street={street} />
          </div>

          {/* 底池 */}
          <PotDisplay
            potSize={potSize}
            userStack={userStack}
            opponentStack={opponentStack}
          />

          {/* 胜率/赔率/EV */}
          <EquityDisplay equity={equity} potOdds={potOdds} ev={ev} />

          {/* 手牌 - 下方 */}
          <div className="mt-2">
            <HoleCards cards={holeCards} highlight={isUserTurn} />
          </div>
        </div>

        {/* 操作区域 */}
        <div className="w-full max-w-lg space-y-2">
          {isUserTurn && !isHandComplete ? (
            <div className="space-y-2">
              {advice && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
                  <span className="text-blue-300">
                    GTO:{" "}
                    <span className="font-semibold text-blue-200">
                      {advice.action === "fold"
                        ? "弃牌"
                        : advice.action === "check"
                          ? "过牌"
                          : advice.action === "call"
                            ? "跟注"
                            : advice.action === "raise" && advice.raiseSize
                              ? `下注 ${Math.round(
                                  advice.raiseSize *
                                    (street === "preflop" ? settings.blindBig : 1)
                                )}`
                              : "加注"}
                    </span>
                  </span>
                  <span className="text-blue-300/70">
                    {Math.round(advice.frequency * 100)}%
                  </span>
                </div>
              )}
              <ActionButtons
                canCheck={canCheck}
                callAmount={callAmount}
                minRaise={minRaise}
                maxRaise={maxRaise}
                disabled={false}
                onAction={handleAction}
              />
            </div>
          ) : isHandComplete ? (
            <div className="flex flex-col items-center gap-2">
              <div className={`text-sm font-bold ${handResult === "win" ? "text-emerald-400" : "text-red-400"}`}>
                {handResult === "win" ? `你赢得 ${netChips.toLocaleString()}！` : handResult === "lose" ? "你输了这手牌" : "你弃牌了"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextHand}
                  className="px-6 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  下一手
                </button>
                <button
                  onClick={handleAdvanceStreet}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
                >
                  进入下一轮
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div className="text-xs text-muted-foreground/50">等待对手行动...</div>
              <button
                onClick={handleAdvanceStreet}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
              >
                进入下一轮
              </button>
            </div>
          )}

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
            >
              {showHistory ? "隐藏历史" : "手牌历史"}
            </button>
            <button
              onClick={handleEndSession}
              className="text-[10px] text-red-400/50 hover:text-red-400/70 transition-colors"
            >
              结束训练
            </button>
          </div>
        </div>
      </div>

      {/* 手牌历史 */}
      {showHistory && (
        <div className="border-t border-border/20 p-3">
          <HandHistory decisions={decisions} />
        </div>
      )}
    </div>
  )
}
