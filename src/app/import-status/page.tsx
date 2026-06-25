import { ImportStatusClient } from "@/components/poker/import-status/import-status-client"

export const metadata = {
  title: "导入状态 - Poker Tracker",
  description: "查看 Excel 文件监控状态和导入历史",
}

export default function ImportStatusPage() {
  return <ImportStatusClient />
}
