import { SeasonReportClient } from "@/components/poker/season-report/season-report-client"

export const metadata = {
  title: "赛季总结报告 - Poker Tracker",
  description: "查看赛季数据看板、大事记、积分走势和赛季对比",
}

export default function SeasonReportPage() {
  return <SeasonReportClient />
}