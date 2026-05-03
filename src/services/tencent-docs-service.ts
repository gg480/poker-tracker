export function parseDocumentUrl(url: string): {
  docId: string
  sheetId: string
  type: "sheet" | "csv" | "other"
} {
  const sheetMatch = url.match(/docs\.qq\.com\/sheet\/([\w-]+)(\?tab=([\w-]+))?/)
  if (sheetMatch) {
    return {
      docId: sheetMatch[1],
      sheetId: sheetMatch[3] || "0",
      type: "sheet",
    }
  }
  if (url.endsWith(".csv") || url.includes(".csv?")) {
    return { docId: "", sheetId: "", type: "csv" }
  }
  return { docId: "", sheetId: "", type: "other" }
}

export function parseCSVToRecords(csvText: string): {
  success: boolean
  records: { date: string; player: string; score: number }[]
  errors: string[]
} {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) {
    return { success: false, records: [], errors: ["CSV数据不足，至少需要表头+1行数据"] }
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "").toLowerCase())
  const dateIdx = headers.findIndex((h) => ["date", "日期", "时间"].includes(h))
  const playerIdx = headers.findIndex((h) => ["player", "玩家", "姓名", "名字"].includes(h))
  const scoreIdx = headers.findIndex((h) => ["score", "积分", "分数", "得分"].includes(h))

  if (dateIdx === -1 || playerIdx === -1 || scoreIdx === -1) {
    return {
      success: false,
      records: [],
      errors: [
        `无法识别列头。需要: date/日期, player/玩家, score/积分。实际: ${headers.join(", ")}`,
      ],
    }
  }

  const records: { date: string; player: string; score: number }[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""))
    const date = cols[dateIdx]
    const player = cols[playerIdx]
    const score = Number(cols[scoreIdx])

    if (!date || !player || isNaN(score)) {
      errors.push(`第${i + 1}行数据不完整: ${lines[i]}`)
      continue
    }

    const normalizedDate = normalizeDate(date)
    if (!normalizedDate) {
      errors.push(`第${i + 1}行日期格式错误: ${date}`)
      continue
    }

    records.push({ date: normalizedDate, player, score })
  }

  return { success: records.length > 0, records, errors }
}

function normalizeDate(dateStr: string): string | null {
  const ymdMatch = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  const cnMatch = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
  if (cnMatch) {
    const [, y, m, d] = cnMatch
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  const mdyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  return null
}

export function recordsToCSV(records: { date: string; player: string; score: number }[]): string {
  const header = "日期,玩家,积分"
  const rows = records.map((r) => `${r.date},${r.player},${r.score}`)
  return [header, ...rows].join("\n")
}
