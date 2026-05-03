"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { parseCSVToRecords, recordsToCSV, parseDocumentUrl } from "@/services/tencent-docs-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TencentDocsPanelProps {
  onImport: (records: { date: string; player: string; score: number }[]) => void
  onExportCSV: () => void
}

export function TencentDocsPanel({ onImport, onExportCSV }: TencentDocsPanelProps) {
  const [url, setUrl] = useState("")
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [preview, setPreview] = useState<{ date: string; player: string; score: number }[] | null>(null)
  const [apiConfigured, setApiConfigured] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [configForm, setConfigForm] = useState({ clientId: "", clientSecret: "" })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/tencent-docs?action=status")
      .then((r) => r.json())
      .then((data) => {
        setApiConfigured(data.configured)
        if (data.clientId) {
          setConfigForm((f) => ({ ...f, clientId: data.clientId }))
        }
      })
      .catch(() => {})

    const savedToken = localStorage.getItem("tencent_docs_token")
    if (savedToken) {
      try {
        const parsed = JSON.parse(savedToken)
        if (parsed.expiresAt > Date.now()) {
          setAccessToken(parsed.accessToken)
        } else {
          localStorage.removeItem("tencent_docs_token")
        }
      } catch {
        localStorage.removeItem("tencent_docs_token")
      }
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "tencent-docs-token") {
        const token = e.data.accessToken
        setAccessToken(token)
        localStorage.setItem(
          "tencent_docs_token",
          JSON.stringify({
            accessToken: token,
            refreshToken: e.data.refreshToken,
            expiresAt: Date.now() + (e.data.expiresIn || 7200) * 1000,
          })
        )
        setMsg({ type: "success", text: "腾讯文档授权成功" })
        setTimeout(() => setMsg(null), 3000)
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  const handleAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/tencent-docs?action=auth-url")
      const data = await res.json()
      if (data.error) {
        setMsg({ type: "error", text: data.error })
        return
      }
      window.open(data.url, "tencent-docs-auth", "width=600,height=500")
    } catch {
      setMsg({ type: "error", text: "获取授权链接失败" })
    }
  }, [])

  const handleUrlImport = useCallback(async () => {
    if (!url.trim()) {
      setMsg({ type: "error", text: "请输入腾讯文档链接" })
      return
    }

    const parsed = parseDocumentUrl(url)
    if (parsed.type !== "sheet") {
      setMsg({ type: "error", text: "请输入有效的腾讯文档链接（docs.qq.com/sheet/...）" })
      return
    }

    if (!apiConfigured) {
      setMsg({
        type: "info",
        text: "在线API未配置。请在下方配置密钥，或使用CSV文件导入方式。",
      })
      setShowConfig(true)
      return
    }

    if (!accessToken) {
      setMsg({ type: "info", text: "请先点击「授权」按钮完成腾讯文档授权" })
      return
    }

    setMsg({ type: "info", text: "正在从腾讯文档获取数据..." })

    try {
      const res = await fetch(
        `/api/tencent-docs?action=fetch-sheet&docId=${parsed.docId}&sheetId=${parsed.sheetId}&accessToken=${accessToken}`
      )
      const data = await res.json()

      if (data.error) {
        setMsg({ type: "error", text: data.error })
        return
      }

      const csvText = sheetDataToCSV(data)
      const result = parseCSVToRecords(csvText)

      if (!result.success) {
        setMsg({ type: "error", text: result.errors.join("; ") })
        return
      }

      setPreview(result.records)
      setMsg({
        type: "info",
        text: `解析成功: ${result.records.length} 条记录${result.errors.length > 0 ? `，${result.errors.length} 条跳过` : ""}`,
      })
    } catch {
      setMsg({ type: "error", text: "获取腾讯文档数据失败，请检查链接和授权状态" })
    }
  }, [url, apiConfigured, accessToken])

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const result = parseCSVToRecords(text)

    if (!result.success) {
      setMsg({ type: "error", text: result.errors.join("; ") })
      return
    }

    setPreview(result.records)
    setMsg({
      type: "info",
      text: `解析成功: ${result.records.length} 条记录${result.errors.length > 0 ? `，${result.errors.length} 条跳过` : ""}`,
    })
  }, [])

  const handleConfirmImport = useCallback(() => {
    if (preview && preview.length > 0) {
      onImport(preview)
      setMsg({ type: "success", text: `已导入 ${preview.length} 条记录` })
      setPreview(null)
      setTimeout(() => setMsg(null), 3000)
    }
  }, [preview, onImport])

  const handleSaveConfig = useCallback(() => {
    if (!configForm.clientId || !configForm.clientSecret) {
      setMsg({ type: "error", text: "请填写 Client ID 和 Client Secret" })
      return
    }
    setMsg({
      type: "info",
      text: "密钥需配置在服务器环境变量中。请在项目根目录创建 .env.local 文件，添加以下内容后重启开发服务器：",
    })
    setShowConfig(false)
  }, [configForm])

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">📄</span> 腾讯文档集成
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {msg && (
          <Alert
            variant={msg.type === "error" ? "destructive" : "default"}
            className={
              msg.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10"
                : msg.type === "info"
                  ? "border-blue-500/30 bg-blue-500/10"
                  : ""
            }
          >
            <AlertDescription className="text-sm whitespace-pre-line">{msg.text}</AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">腾讯文档链接</label>
          <div className="flex gap-2">
            <Input
              placeholder="https://docs.qq.com/sheet/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-background/80 border-border"
            />
            {apiConfigured && (
              <Button
                variant="outline"
                size="sm"
                onClick={accessToken ? handleUrlImport : handleAuth}
              >
                {accessToken ? "导入" : "授权"}
              </Button>
            )}
            {!apiConfigured && (
              <Button variant="outline" size="sm" onClick={handleUrlImport}>
                导入
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {apiConfigured
                ? accessToken
                  ? "已授权，可直接从在线文档导入"
                  : "API已配置，需授权后导入"
                : "API未配置，请配置密钥或使用CSV方式"}
            </span>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs text-primary hover:underline"
            >
              {showConfig ? "收起配置" : "配置密钥"}
            </button>
          </div>
        </div>

        {showConfig && (
          <div className="p-3 border border-border/50 rounded-lg bg-muted/10 space-y-3">
            <div className="text-xs font-medium text-muted-foreground">腾讯文档 API 密钥配置</div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Client ID</label>
              <Input
                placeholder="从腾讯开放平台获取"
                value={configForm.clientId}
                onChange={(e) => setConfigForm((f) => ({ ...f, clientId: e.target.value }))}
                className="bg-background/80 border-border text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Client Secret</label>
              <Input
                type="password"
                placeholder="从腾讯开放平台获取"
                value={configForm.clientSecret}
                onChange={(e) => setConfigForm((f) => ({ ...f, clientSecret: e.target.value }))}
                className="bg-background/80 border-border text-sm"
              />
            </div>
            <div className="p-2.5 rounded-md bg-muted/20 text-xs text-muted-foreground space-y-1">
              <div className="font-medium text-foreground">配置方法：</div>
              <div>1. 访问 <span className="text-primary">https://open.tencent.com/</span> 注册开发者账号</div>
              <div>2. 进入「应用管理」→「创建应用」，选择「腾讯文档」</div>
              <div>3. 获取 Client ID 和 Client Secret</div>
              <div>4. 在项目根目录创建 <span className="font-mono">.env.local</span> 文件：</div>
              <pre className="bg-background/50 p-2 rounded text-[11px] font-mono mt-1 overflow-x-auto">{`TENCENT_DOCS_CLIENT_ID=你的ClientID
TENCENT_DOCS_CLIENT_SECRET=你的ClientSecret
TENCENT_DOCS_REDIRECT_URI=http://localhost:3000/api/tencent-docs/callback`}</pre>
              <div>5. 重启开发服务器（npm run dev）</div>
            </div>
            <Button size="sm" onClick={handleSaveConfig} className="w-full">
              确认配置
            </Button>
          </div>
        )}

        <div className="border-t border-border/30 pt-3">
          <label className="block text-xs text-muted-foreground mb-1.5">CSV 文件导入/导出</label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              📥 选择 CSV 文件
            </Button>
            <Button variant="outline" size="sm" onClick={onExportCSV}>
              📤 导出为 CSV
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleFileImport}
          />
          <p className="text-xs text-muted-foreground mt-1">
            CSV 格式: 日期,玩家,积分（支持中英文列头）
          </p>
        </div>

        {preview && (
          <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">预览 ({preview.length} 条)</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                  取消
                </Button>
                <Button size="sm" onClick={handleConfirmImport}>
                  确认导入
                </Button>
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-0.5">
              {preview.slice(0, 20).map((r, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">{r.date}</span>
                  <span>{r.player}</span>
                  <span className={`font-mono ${r.score > 0 ? "text-emerald-400" : r.score < 0 ? "text-red-400" : ""}`}>
                    {r.score > 0 ? "+" : ""}{r.score}
                  </span>
                </div>
              ))}
              {preview.length > 20 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  ...还有 {preview.length - 20} 条
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function sheetDataToCSV(data: Record<string, unknown>): string {
  const dataObj = (data.data || data) as Record<string, unknown>
  const rows = (dataObj?.rows || []) as Array<{ cells: Array<{ content: string }> }>
  if (!rows.length) return ""
  return rows
    .map((row) =>
      (row.cells || [])
        .map((cell) => String(cell.content || "").replace(/,/g, "，"))
        .join(",")
    )
    .join("\n")
}
