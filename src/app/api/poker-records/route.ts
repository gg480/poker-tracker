import { NextRequest, NextResponse } from "next/server";
import { getAllRecords, getRecordsByDateRange, insertRecords, deleteRecordsByDate } from "@/storage/database/crud-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let data;
    if (startDate && endDate) {
      data = await getRecordsByDateRange(startDate, endDate);
    } else {
      data = await getAllRecords();
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const records = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid records" }, { status: 400 });
    }
    const data = await insertRecords(records);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { date } = await request.json();
    if (!date) {
      return NextResponse.json({ success: false, error: "Missing date" }, { status: 400 });
    }
    await deleteRecordsByDate(date);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
