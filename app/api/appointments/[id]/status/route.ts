import { NextResponse } from "next/server"
import { transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json()
    if (!["scheduled", "in_progress", "completed", "canceled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await transaction(async (conn: PoolConnection) => {
      await conn.execute("UPDATE appointments SET status = ? WHERE id = ?", [status, Number(params.id)])
      await conn.execute("INSERT INTO status_history (appointment_id, status) VALUES (?, ?)", [
        Number(params.id),
        status,
      ])
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
