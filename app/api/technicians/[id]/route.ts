import { NextResponse } from "next/server"
import { transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const { name, skill_level } = await req.json()
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
    const level = ["junior", "mid", "senior"].includes(String(skill_level)) ? skill_level : "mid"
    await transaction(async (conn: PoolConnection) => {
      await conn.execute("UPDATE technicians SET name=?, skill_level=? WHERE id=?", [name, level, id])
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
      await conn.execute("DELETE FROM technicians WHERE id=?", [id])
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
