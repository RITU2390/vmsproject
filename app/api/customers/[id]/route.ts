import { NextResponse } from "next/server"
import { transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    await transaction(async (conn: PoolConnection) => {
      await conn.execute("DELETE FROM customers WHERE id = ?", [id])
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
