import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

const APPOINTMENT_STATUSES = ["scheduled", "in_progress", "completed", "canceled"] as const

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get("scope")
    let where = ""
    const params: any[] = []

    if (scope === "today") {
      where = "WHERE DATE(a.start_time) = CURDATE()"
    }

    const rows = await query(
      `
      SELECT
        a.id, a.start_time, a.end_time, a.status,
        c.name as customer_name,
        CONCAT(v.make, ' ', v.model, ' ', COALESCE(v.plate,'')) as vehicle_label,
        s.name as service_name,
        t.name as technician_name
      FROM appointments a
      JOIN customers c ON c.id = a.customer_id
      JOIN vehicles v ON v.id = a.vehicle_id
      JOIN service_types s ON s.id = a.service_type_id
      LEFT JOIN technicians t ON t.id = a.technician_id
      ${where}
      ORDER BY a.start_time ASC
      `,
      params,
    )
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

type NewAppointmentPayload = {
  customerId: number
  vehicle: { make: string; model: string; year?: string; plate?: string }
  serviceTypeId: number
  preferredStart?: string | null
  autoSchedule?: boolean
  notes?: string
}

export async function POST(req: Request) {
  try {
    const body: NewAppointmentPayload = await req.json()
    if (!body.customerId || !body.vehicle?.make || !body.vehicle?.model || !body.serviceTypeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const service = (await query<any[]>("SELECT duration_minutes FROM service_types WHERE id = ?", [
      body.serviceTypeId,
    ])) as any
    if (!service || service.length === 0) return NextResponse.json({ error: "Invalid service type" }, { status: 400 })
    const duration = Number(service[0].duration_minutes)

    const preferred = body.preferredStart ? new Date(body.preferredStart) : null

    const result = await transaction(async (conn: PoolConnection) => {
      // Create or reuse a vehicle for this customer (simple: always insert quick vehicle for demo)
      const [vehRes]: any = await conn.execute(
        "INSERT INTO vehicles (customer_id, make, model, year, plate) VALUES (?, ?, ?, ?, ?)",
        [
          body.customerId,
          body.vehicle.make,
          body.vehicle.model,
          body.vehicle.year ? Number(body.vehicle.year) : null,
          body.vehicle.plate || null,
        ],
      )
      const vehicleId = vehRes.insertId as number

      // Scheduling: either honor preferredStart if no conflict, or find earliest slot and a technician
      const { start, end, technicianId } = await findSlot(conn, duration, preferred, !!body.autoSchedule)

      const [apptRes]: any = await conn.execute(
        `INSERT INTO appointments (customer_id, vehicle_id, service_type_id, technician_id, start_time, end_time, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [body.customerId, vehicleId, body.serviceTypeId, technicianId, start, end, body.notes || null],
      )
      const apptId = apptRes.insertId as number

      await conn.execute("INSERT INTO status_history (appointment_id, status) VALUES (?, 'scheduled')", [apptId])

      return { apptId }
    })

    return NextResponse.json({ ok: true, id: result.apptId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function findSlot(conn: PoolConnection, durationMinutes: number, preferred: Date | null, autoSchedule: boolean) {
  // Simple business hours: 9:00 - 17:00
  const workStartHour = 9
  const workEndHour = 17

  // Load technicians
  const [techs]: any = await conn.query("SELECT id FROM technicians ORDER BY id ASC")
  const techIds: number[] = techs.map((t: any) => t.id)
  if (techIds.length === 0) throw new Error("No technicians available")

  // Utility to check conflicts for a technician
  async function hasConflict(techId: number, start: Date, end: Date) {
    const [rows]: any = await conn.query(
      `SELECT id FROM appointments
       WHERE technician_id = ?
         AND status IN ('scheduled','in_progress')
         AND NOT (end_time <= ? OR start_time >= ?) LIMIT 1`,
      [techId, toSqlDateTime(start), toSqlDateTime(end)],
    )
    return rows.length > 0
  }

  function clampToWorkday(d: Date) {
    const nd = new Date(d)
    nd.setSeconds(0, 0)
    const h = nd.getHours()
    if (h < workStartHour) nd.setHours(workStartHour, 0, 0, 0)
    if (h >= workEndHour) nd.setHours(workEndHour - 1, 0, 0, 0)
    return nd
  }

  // Try preferred if provided
  if (preferred && !autoSchedule) {
    const start = clampToWorkday(preferred)
    const end = new Date(start.getTime() + durationMinutes * 60000)
    if (end.getHours() > workEndHour) {
      throw new Error("Preferred time exceeds working hours")
    }
    // pick technician with least load in that interval
    const techId = await pickLeastLoadedTech(conn, techIds, start, end)
    if (await hasConflict(techId, start, end)) throw new Error("Conflict at preferred time")
    return { start: toSqlDateTime(start), end: toSqlDateTime(end), technicianId: techId }
  }

  // Auto-schedule: search next available 10-min slot among technicians for the next 7 days
  const startBase = clampToWorkday(preferred ?? new Date())
  for (let day = 0; day < 7; day++) {
    for (let hour = workStartHour; hour <= workEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const slotStart = new Date(startBase)
        slotStart.setDate(startBase.getDate() + day)
        slotStart.setHours(hour, minute, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000)
        if (slotEnd.getHours() > workEndHour) continue

        // pick technician with least load for this candidate
        const techId = await pickLeastLoadedTech(conn, techIds, slotStart, slotEnd)
        if (!(await hasConflict(techId, slotStart, slotEnd))) {
          return { start: toSqlDateTime(slotStart), end: toSqlDateTime(slotEnd), technicianId: techId }
        }
      }
    }
  }

  throw new Error("No available slot in the next 7 days")
}

async function pickLeastLoadedTech(conn: PoolConnection, techIds: number[], start: Date, end: Date) {
  const loads: { techId: number; count: number }[] = []
  for (const id of techIds) {
    const [rows]: any = await conn.query(
      `SELECT COUNT(*) as c FROM appointments
       WHERE technician_id = ?
         AND DATE(start_time) = DATE(?)
         AND status IN ('scheduled','in_progress')`,
      [id, toSqlDateTime(start)],
    )
    loads.push({ techId: id, count: Number(rows[0]?.c || 0) })
  }
  loads.sort((a, b) => a.count - b.count)
  return loads[0].techId
}

function toSqlDateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}
