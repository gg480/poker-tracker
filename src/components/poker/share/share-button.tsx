"use client"

import { useState, useCallback } from "react"
import type { ShareCardData } from "@/lib/types"
import { downloadShareImage } from "@/services/share-service"
import { ShareCard } from "./share-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShareButtonProps {
  data: ShareCardData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareButton({ data, open, onOpenChange }: ShareButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      const filename = `poker-${data?.date || "session"}-${Date.now()}.png`
      await downloadShareImage("share-card", filename)
    } catch {
      // Show a toast notification so the user knows the download didn't work
      const { toast } = await import("sonner")
      toast.error("保存图片失败，请重试")
    } finally {
      setDownloading(false)
    }
  }, [data])

  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>分享战绩</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <ShareCard data={data} />
        </div>
        <div className="flex justify-center gap-3 mt-2">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="sm"
          >
            {downloading ? "生成中..." : "💾 保存图片"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
