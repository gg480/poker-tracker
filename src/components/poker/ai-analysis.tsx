"use client";

import { useState, useRef, useCallback } from "react";
import type { ComputedStats } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface AIAnalysisProps {
  stats: ComputedStats;
}

interface HistoryItem {
  q: string;
  a: string;
  time: string;
}

const PRESETS = [
  { label: '整体战报', prompt: '请生成一份赛季2的整体战报总结，包括各玩家表现点评、排名分析、趣味数据等。语言风格活泼有趣。' },
  { label: '玩家风格分析', prompt: '根据每个玩家的胜率、波动、盈亏数据，分析每位玩家的打牌风格（激进/保守/稳健等），并给出简短评价。' },
  { label: '最近趋势', prompt: '分析最近10场的趋势变化，谁在上升期，谁在下降期，有什么值得关注的信号？' },
  { label: '对局预测', prompt: '如果下一场参加的玩家是佳、茄、润、谦、卢老师，根据历史数据预测可能的结果。' },
  { label: '趣味数据', prompt: '从数据中挖掘一些趣味统计，比如最大翻盘、连胜记录、克星关系等。' },
];

function buildContext(stats: ComputedStats): string {
  const summary = stats.players.map(p =>
    `${p.name}: 总分${p.total}, ${p.games}场, 胜率${p.winRate}%, 单日最高+${p.maxWin}, 最低${p.maxLoss}, 场均${p.avgScore}`
  ).join('\n');

  const recent = stats.dates.slice(-10).map(d => {
    const recs = stats.dateMap[d].map(r => `${r.player}:${r.score > 0 ? '+' : ''}${r.score}`).join(', ');
    return `${d}: ${recs}`;
  }).join('\n');

  return `你是一个德州扑克数据分析专家。以下是一个朋友局德州扑克积分数据（赛季2）。

## 玩家汇总
${summary}

## 最近10场详情
${recent}

共${stats.totalGames}场，${stats.totalRecords}条记录，${stats.players.length}位玩家。
数据时间范围: ${stats.dates[0]} ~ ${stats.dates[stats.dates.length - 1]}

请用中文回答，风格简洁有趣，可以用emoji。`;
}

export function AIAnalysis({ stats }: AIAnalysisProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const askAI = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: buildContext(stats) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
                setResult(fullText);
              }
              if (parsed.error) {
                fullText += `\n\n❌ 错误: ${parsed.error}`;
                setResult(fullText);
              }
            } catch {
              // ignore parse errors in SSE
            }
          }
        }
      }

      setHistory(prev => [...prev, {
        q: prompt,
        a: fullText,
        time: new Date().toLocaleTimeString(),
      }]);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setResult(`请求失败: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [stats]);

  const handlePresetClick = (prompt: string) => {
    setQuery(prompt);
    askAI(prompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🤖</span> AI 分析助手
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">AI会基于你的全部积分数据进行分析，支持自定义问题</p>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => handlePresetClick(p.prompt)}
                disabled={loading}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              rows={2}
              placeholder="输入你的问题..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && query.trim()) {
                  e.preventDefault();
                  askAI(query);
                }
              }}
              className="bg-background/80 border-border flex-1 resize-y"
              disabled={loading}
            />
            <Button
              onClick={() => askAI(query)}
              disabled={loading || !query.trim()}
              className="shrink-0 self-end"
            >
              {loading ? '分析中...' : '分析'}
            </Button>
          </div>

          {loading && !result && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {result && (
            <div className="p-4 bg-background/80 rounded-xl border border-border/50">
              <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed font-sans m-0">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">📜</span> 分析历史
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
              {[...history].reverse().map((h, i) => (
                <div key={i} className="p-3 bg-background/80 rounded-lg border-l-[3px] border-l-primary">
                  <div className="text-[11px] text-muted-foreground mb-1">{h.time}</div>
                  <div className="text-xs text-amber-500 mb-2">Q: {h.q.slice(0, 80)}...</div>
                  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed font-sans max-h-[200px] overflow-y-auto m-0">
                    {h.a}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
