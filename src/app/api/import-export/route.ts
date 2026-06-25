import { NextRequest, NextResponse } from "next/server"
import { exportToJSON, importFromJSON } from "@/services/import-export-service"
import { importJsonSchema, validationErrorResponse, ValidationError } from "../_validators"

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

const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    // Require JSON content type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    // Guard: check content-length header before reading body
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_IMPORT_SIZE) {
      return NextResponse.json(
        { success: false, error: "Import file too large (max 10MB)" },
        { status: 413 },
      );
    }

    const text = await request.text();

    // Guard: enforce size after reading as a safety net
    if (text.length > MAX_IMPORT_SIZE) {
      return NextResponse.json(
        { success: false, error: "Import file too large (max 10MB)" },
        { status: 413 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const validationResult = importJsonSchema.safeParse(parsed);
    if (!validationResult.success) {
      return validationErrorResponse(new ValidationError(validationResult.error.issues));
    }

    const result = importFromJSON(text);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message, stats: result.stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
