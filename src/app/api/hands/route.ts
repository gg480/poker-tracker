import { NextRequest, NextResponse } from "next/server";
import { getAllHands, getHandsBySession, getHandsBySeason, getIncompleteHands, getHandsByCompleteStatus, insertHandRecord, updateHandRecord, deleteHandRecord } from "@/storage/database/crud";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("season_id");
    const sessionId = searchParams.get("session_id");
    const isCompleteParam = searchParams.get("is_complete");

    let data;
    if (sessionId) {
      data = getHandsBySession(sessionId);
    } else if (isCompleteParam !== null) {
      const isComplete = isCompleteParam === "true";
      if (seasonId) {
        data = getHandsByCompleteStatus(isComplete, seasonId);
      } else {
        data = getHandsByCompleteStatus(isComplete);
      }
    } else if (seasonId) {
      data = getHandsBySeason(seasonId);
    } else {
      data = getAllHands();
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const record = await request.json();
    const data = insertHandRecord(record);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    const data = updateHandRecord(id, updates);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }
    deleteHandRecord(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
