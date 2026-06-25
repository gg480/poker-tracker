import { NextRequest, NextResponse } from "next/server"
import { seedDatabase, isSeeded } from "@/storage/database/seed"
import { respond } from "@/services/crud-service"

export async function GET() {
  return respond(() => {
    if (isSeeded()) return { message: "Already seeded" }
    seedDatabase()
    return { message: "Database seeded" }
  })
}

export async function POST(request: NextRequest) {
  // 修复 OP-20: 添加环境变量 token 验证，防止远程清空数据库
  const adminToken = process.env.ADMIN_TOKEN
  if (adminToken) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    if (token !== adminToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: invalid or missing admin token" },
        { status: 401 }
      )
    }
  }
  return respond(() => {
    seedDatabase()
    return { message: "Database seeded (forced)" }
  })
}
