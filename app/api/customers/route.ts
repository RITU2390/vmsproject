import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function GET() {
  try {
    const rows = await query("SELECT id, name, phone, email, created_at FROM customers ORDER BY created_at DESC")
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, email } = body
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    await transaction(async (conn: PoolConnection) => {
      await conn.execute("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)", [
        name,
        phone || null,
        email || null,
      ])
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
