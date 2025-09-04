"use client"

import type React from "react"
import useSWR from "swr"
import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function ServicesPage() {
  const { data, mutate } = useSWR("/api/service-types", fetcher)
  const [form, setForm] = useState({ name: "", duration_minutes: "", base_price: "" })

  async function addService(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/service-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        duration_minutes: Number(form.duration_minutes),
        base_price: form.base_price ? Number(form.base_price) : 0,
      }),
    })
    if (res.ok) {
      setForm({ name: "", duration_minutes: "", base_price: "" })
      mutate()
    } else {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || "Failed to add service")
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this service?")) return
    const res = await fetch(`/api/service-types/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || "Failed to delete")
    } else {
      mutate()
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Title */}
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
          Service Types
        </h1>

        {/* Add Service Form */}
        <Card className="shadow-lg border-none bg-gradient-to-br from-indigo-50 via-white to-pink-50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-indigo-700">Add New Service</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 md:grid-cols-4 gap-3"
              onSubmit={addService}
            >
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Duration (min)"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Base price"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
              />
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
              >
                Add
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Services List */}
        <Card className="shadow-lg border-none bg-gradient-to-br from-pink-50 via-white to-indigo-50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-pink-700">All Services</CardTitle>
          </CardHeader>
          <CardContent>
            {(data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No services added yet.</p>
            ) : (
              <div className="grid gap-4">
                {(data ?? []).map((s: any, i: number) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between bg-white shadow-sm border rounded-xl px-4 py-3 hover:shadow-md transition"
                  >
                    {/* Service Info */}
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">{s.name}</span>
                      <div className="flex gap-2 text-sm text-gray-600">
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                          {s.duration_minutes} min
                        </Badge>
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                          ${s.base_price}
                        </Badge>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(s.id)}
                      className="rounded-lg"
                    >
                      Delete
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
