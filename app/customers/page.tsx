"use client"

import type React from "react"
import useSWR from "swr"
import { useState } from "react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CustomersPage() {
  const { data, mutate } = useSWR("/api/customers", fetcher)
  const [form, setForm] = useState({ name: "", phone: "", email: "" })
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed")
      setForm({ name: "", phone: "", email: "" })
      mutate()
    } finally {
      setLoading(false)
    }
  }

  async function deleteCustomer(id: number) {
    if (!confirm("Delete this customer? This will also remove related vehicles.")) return
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || "Failed to delete customer")
    } else {
      mutate()
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Heading */}
        <h1 className="text-2xl font-bold tracking-tight">👥 Customers</h1>

        {/* Add Customer */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Add Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 md:grid-cols-4 gap-3"
              onSubmit={addCustomer}
            >
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* All Customers */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">All Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {(data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No customers yet.</p>
            ) : (
              <div className="divide-y">
                {(data ?? []).map((c: any) => (
                  <div key={c.id} className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {c.phone || "—"} • {c.email || "—"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setExpandedId(expandedId === c.id ? null : c.id)
                          }
                        >
                          {expandedId === c.id
                            ? "Hide Vehicles"
                            : "Manage Vehicles"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCustomer(c.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Vehicles Section */}
                    {expandedId === c.id && (
                      <div className="mt-3">
                        <VehiclesManager customerId={c.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

/* ------------------------- Vehicles Manager ------------------------- */
function VehiclesManager({ customerId }: { customerId: number }) {
  const { data, mutate } = useSWR(`/api/vehicles?customerId=${customerId}`, fetcher)
  const [veh, setVeh] = useState({ make: "", model: "", year: "", plate: "" })
  const [saving, setSaving] = useState(false)

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          make: veh.make,
          model: veh.model,
          year: veh.year || null,
          plate: veh.plate || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to add vehicle")
      setVeh({ make: "", model: "", year: "", plate: "" })
      mutate()
    } finally {
      setSaving(false)
    }
  }

  async function removeVehicle(id: number) {
    if (!confirm("Delete this vehicle?")) return
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || "Failed to delete vehicle")
    } else {
      mutate()
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      {/* Add Vehicle Form */}
      <form
        className="grid grid-cols-1 md:grid-cols-5 gap-3"
        onSubmit={addVehicle}
      >
        <Input
          placeholder="Make"
          value={veh.make}
          onChange={(e) => setVeh({ ...veh, make: e.target.value })}
          required
        />
        <Input
          placeholder="Model"
          value={veh.model}
          onChange={(e) => setVeh({ ...veh, model: e.target.value })}
          required
        />
        <Input
          type="number"
          placeholder="Year"
          value={veh.year}
          onChange={(e) => setVeh({ ...veh, year: e.target.value })}
        />
        <Input
          placeholder="Plate"
          value={veh.plate}
          onChange={(e) => setVeh({ ...veh, plate: e.target.value })}
        />
        <Button type="submit" disabled={saving} className="w-full md:w-auto">
          {saving ? "Adding..." : "Add Vehicle"}
        </Button>
      </form>

      {/* Vehicle List */}
      <div className="mt-4">
        {(data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No vehicles yet.</p>
        ) : (
          <ul className="space-y-2">
            {(data ?? []).map((v: any) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 shadow-sm"
              >
                <span className="text-sm">
                  {v.make} {v.model}{" "}
                  {v.year ? `(${v.year})` : ""} {v.plate ? `• ${v.plate}` : ""}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeVehicle(v.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
