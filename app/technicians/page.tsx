"use client"

import type React from "react"
import { useState } from "react"
import useSWR from "swr"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function TechniciansPage() {
  const { data, mutate } = useSWR("/api/technicians", fetcher)
  const [form, setForm] = useState({ name: "", skill_level: "mid" })

  async function addTech(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/technicians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ name: "", skill_level: "mid" })
      mutate()
    } else {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || "Failed to add technician")
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this technician?")) return
    const res = await fetch(`/api/technicians/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || "Failed to delete")
    } else {
      mutate()
    }
  }

  return (
    <AppShell>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Add Technician Form */}
        <Card className="rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Add Technician
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={addTech}
            >
              <Input
                placeholder="Enter technician name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Select
                value={form.skill_level}
                onValueChange={(v) =>
                  setForm({ ...form, skill_level: v as "junior" | "mid" | "senior" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">👩‍💻 Junior</SelectItem>
                  <SelectItem value="mid">🛠️ Mid</SelectItem>
                  <SelectItem value="senior">🚀 Senior</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="submit"
                className="w-full rounded-xl"
              >
                ➕ Add Technician
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Technician List */}
        <Card className="rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition">
          <CardHeader className="sticky top-0 bg-white z-10 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">
              All Technicians
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {(data ?? []).map((t: any) => (
                <div
                  key={t.id}
                  className="py-4 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition"
                >
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{t.name}</span>
                    <span className="ml-2 text-xs text-gray-500 uppercase tracking-wide">
                      {t.skill_level}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => remove(t.id)}
                  >
                    ✖ Delete
                  </Button>
                </div>
              ))}
              {(!data || data.length === 0) && (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No technicians added yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
