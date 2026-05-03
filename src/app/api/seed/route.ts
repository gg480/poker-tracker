import { NextResponse } from "next/server"
import { seedDatabase, isSeeded } from "@/storage/database/seed"

export async function GET() {
  try {
    if (isSeeded()) {
      return NextResponse.json({ success: true, message: "Already seeded" })
    }
    seedDatabase()
    return NextResponse.json({ success: true, message: "Database seeded" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST() {
  try {
    seedDatabase()
    return NextResponse.json({ success: true, message: "Database seeded (forced)" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
