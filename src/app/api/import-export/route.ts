import { NextRequest, NextResponse } from "next/server"
import { exportToJSON, importFromJSON } from "@/services/import-export-service"

export async function GET() {
  try {
    const json = exportToJSON()
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="poker-tracker-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const text = await request.text()
    const result = importFromJSON(text)
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message, stats: result.stats })
    }
    return NextResponse.json({ success: false, error: result.message }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
