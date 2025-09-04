import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get("customerId")
    if (customerId) {
      const rows = await query(
        "SELECT id, make, model, year, vin, plate FROM vehicles WHERE customer_id = ? ORDER BY id DESC",
        [Number(customerId)],
      )
      return NextResponse.json(rows)
    }
    const rows = await query(
      "SELECT v.id, v.make, v.model, v.year, v.vin, v.plate, c.name as customer_name FROM vehicles v JOIN customers c ON c.id = v.customer_id ORDER BY v.id DESC",
    )
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { customerId, make, model, year, vin, plate } = body || {}
    if (!customerId || !make || !model) {
      return NextResponse.json({ error: "customerId, make and model are required" }, { status: 400 })
    }
    await transaction(async (conn: PoolConnection) => {
      await conn.execute(
        "INSERT INTO vehicles (customer_id, make, model, year, vin, plate) VALUES (?, ?, ?, ?, ?, ?)",
        [Number(customerId), make, model, year ? Number(year) : null, vin || null, plate || null],
      )
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
