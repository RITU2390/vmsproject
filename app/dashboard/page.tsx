"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils" // conditional classes

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function Metric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Card
      className={cn(
        "rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300 text-white",
        color
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm opacity-90">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

async function updateStatus(
  id: number,
  status: "scheduled" | "in_progress" | "completed" | "canceled"
) {
  const res = await fetch(`/api/appointments/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    alert(j?.error || "Failed to update status")
  }
}

export default function DashboardPage() {
  const { data: summary, mutate: mutateSummary } = useSWR(
    "/api/dashboard/summary",
    fetcher,
    { refreshInterval: 5000 }
  )
  const { data: appts, mutate } = useSWR(
    "/api/appointments?scope=today",
    fetcher,
    { refreshInterval: 5000 }
  )

  async function onAction(id: number, action: "start" | "complete" | "cancel") {
    if (action === "start") await updateStatus(id, "in_progress")
    if (action === "complete") await updateStatus(id, "completed")
    if (action === "cancel") {
      if (!confirm("Cancel this appointment?")) return
      await updateStatus(id, "canceled")
    }
    mutate()
    mutateSummary()
  }

  return (
    <AppShell>
      {/* Dark background wrapper */}
      <div className="flex flex-col gap-8 bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white min-h-screen p-6 rounded-2xl">
        
        {/* Page Heading */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-transparent bg-clip-text">
          Dashboard
        </h1>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Metric label="Customers" value={summary?.customers ?? "-"} color="bg-gradient-to-r from-blue-500 to-indigo-600" />
          <Metric label="Vehicles" value={summary?.vehicles ?? "-"} color="bg-gradient-to-r from-green-500 to-emerald-600" />
          <Metric label="Technicians" value={summary?.technicians ?? "-"} color="bg-gradient-to-r from-purple-500 to-pink-600" />
          <Metric label="Today’s Appointments" value={summary?.todayAppointments ?? "-"} color="bg-gradient-to-r from-orange-500 to-red-600" />
        </div>

        {/* Appointments Section */}
        <Card className="shadow-xl rounded-2xl border border-gray-700 bg-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Today’s Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-700">
              {(appts ?? []).length === 0 && (
                <p className="text-sm text-gray-400 py-4">
                  No appointments scheduled for today.
                </p>
              )}
              {(appts ?? []).map((a: any) => (
                <div
                  key={a.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  {/* Appointment Info */}
                  <div className="flex flex-col">
                    <span className="font-medium text-lg">{a.customer_name} • {a.vehicle_label}</span>
                    <span className="text-sm text-gray-400">
                      {a.service_name} •{" "}
                      {new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {new Date(a.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={cn(
                        "capitalize px-3 py-1 text-sm rounded-full",
                        a.status === "scheduled" && "bg-blue-500/20 text-blue-400",
                        a.status === "in_progress" && "bg-yellow-500/20 text-yellow-400",
                        a.status === "completed" && "bg-green-500/20 text-green-400",
                        a.status === "canceled" && "bg-red-500/20 text-red-400"
                      )}
                    >
                      {a.status}
                    </Badge>

                    {a.status === "scheduled" && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => onAction(a.id, "start")}>
                          Start
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onAction(a.id, "cancel")}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {a.status === "in_progress" && (
                      <>
                        <Button size="sm" onClick={() => onAction(a.id, "complete")}>
                          Complete
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onAction(a.id, "cancel")}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
