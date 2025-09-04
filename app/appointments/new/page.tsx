"use client"

import type React from "react"
import { useMemo, useState } from "react"
import useSWR from "swr"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function NewAppointmentPage() {
  const { data: customers } = useSWR("/api/customers", fetcher)
  const { data: serviceTypes } = useSWR("/api/service-types", fetcher)

  const [customerId, setCustomerId] = useState<string>("")
  const [vehicle, setVehicle] = useState({ make: "", model: "", year: "", plate: "" })
  const [serviceTypeId, setServiceTypeId] = useState<string>("")
  const [preferredStart, setPreferredStart] = useState<string>("")
  const [autoSchedule, setAutoSchedule] = useState(true)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedService = useMemo(
    () => serviceTypes?.find((s: any) => String(s.id) === serviceTypeId),
    [serviceTypes, serviceTypeId],
  )

  async function createAppointment(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: Number(customerId),
          vehicle,
          serviceTypeId: Number(serviceTypeId),
          preferredStart: preferredStart || null,
          autoSchedule,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      window.location.href = "/dashboard"
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">📅 New Appointment</h1>

        <Card className="shadow-lg rounded-2xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6" onSubmit={createAppointment}>
              {/* Customer */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Customer</label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {(customers ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle */}
              <div className="grid gap-3">
                <label className="text-sm font-medium">Vehicle Information</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Make"
                    value={vehicle.make}
                    onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Model"
                    value={vehicle.model}
                    onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Year"
                    value={vehicle.year}
                    onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                  />
                  <Input
                    placeholder="Plate"
                    value={vehicle.plate}
                    onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                  />
                </div>
              </div>

              {/* Service Type */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Service Type</label>
                <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {(serviceTypes ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} • {s.duration_minutes} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Start + Auto-schedule */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Preferred Start (optional)</label>
                <Input
                  type="datetime-local"
                  value={preferredStart}
                  onChange={(e) => setPreferredStart(e.target.value)}
                />
                <div className="flex items-center gap-2 mt-1">
                  <Checkbox id="auto" checked={autoSchedule} onCheckedChange={(v) => setAutoSchedule(!!v)} />
                  <label htmlFor="auto" className="text-sm text-muted-foreground">
                    Auto schedule to avoid conflicts
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading || !customerId || !serviceTypeId}
                  className="w-full md:w-auto"
                >
                  {loading ? "Creating..." : "Create Appointment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
