import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    await query("SELECT 1")
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
