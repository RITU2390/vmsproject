import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function GET() {
  try {
    const rows = await query("SELECT id, name, skill_level FROM technicians ORDER BY id")
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, skill_level } = await req.json()
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
    const level = ["junior", "mid", "senior"].includes(String(skill_level)) ? skill_level : "mid"
    await transaction(async (conn: PoolConnection) => {
      await conn.execute("INSERT INTO technicians (name, skill_level) VALUES (?, ?)", [name, level])
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
