import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const [customers] = (await query<any[]>("SELECT COUNT(*) as c FROM customers")) as any
    const [vehicles] = (await query<any[]>("SELECT COUNT(*) as c FROM vehicles")) as any
    const [technicians] = (await query<any[]>("SELECT COUNT(*) as c FROM technicians")) as any
    const [todayAppointments] = (await query<any[]>(
      "SELECT COUNT(*) as c FROM appointments WHERE DATE(start_time) = CURDATE()",
    )) as any

    return NextResponse.json({
      customers: customers?.c ?? 0,
      vehicles: vehicles?.c ?? 0,
      technicians: technicians?.c ?? 0,
      todayAppointments: todayAppointments?.c ?? 0,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
