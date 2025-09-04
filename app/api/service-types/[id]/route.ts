import { NextResponse } from "next/server"
import { transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const { name, duration_minutes, base_price } = await req.json()
    if (!name || !duration_minutes) {
      return NextResponse.json({ error: "name and duration_minutes are required" }, { status: 400 })
    }
    await transaction(async (conn: PoolConnection) => {
      await conn.execute("UPDATE service_types SET name=?, duration_minutes=?, base_price=? WHERE id=?", [
        name,
        Number(duration_minutes),
        base_price != null ? Number(base_price) : 0,
        id,
      ])
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    await transaction(async (conn: PoolConnection) => {
      await conn.execute("DELETE FROM service_types WHERE id=?", [id])
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
