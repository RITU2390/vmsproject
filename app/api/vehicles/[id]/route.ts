import { NextResponse } from "next/server"
import { transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await req.json()
    const { make, model, year, vin, plate } = body || {}
    if (!make || !model) {
      return NextResponse.json({ error: "make and model are required" }, { status: 400 })
    }
    await transaction(async (conn: PoolConnection) => {
      await conn.execute("UPDATE vehicles SET make=?, model=?, year=?, vin=?, plate=? WHERE id = ?", [
        make,
        model,
        year ? Number(year) : null,
        vin || null,
        plate || null,
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
      await conn.execute("DELETE FROM vehicles WHERE id = ?", [id])
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    // likely FK constraint if used in appointments
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
