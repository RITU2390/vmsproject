import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function GET() {
  try {
    const rows = await query("SELECT id, name, duration_minutes, base_price FROM service_types ORDER BY id")
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, duration_minutes, base_price } = await req.json()
    if (!name || !duration_minutes) {
      return NextResponse.json({ error: "name and duration_minutes are required" }, { status: 400 })
    }
    await transaction(async (conn: PoolConnection) => {
      await conn.execute("INSERT INTO service_types (name, duration_minutes, base_price) VALUES (?, ?, ?)", [
        name,
        Number(duration_minutes),
        base_price != null ? Number(base_price) : 0,
      ])
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
