"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { MapPin, User, Plus } from "lucide-react"
import { listEventsBetween } from "../lib/supabase"
import { onEventsChanged } from "../lib/events-bus"
import { EventFormModal } from "./event-form-modal"

type UIEvent = {
  id: string
  title: string
  time: string
  endTime: string
  location: string
  category: "classes" | "deadlines" | "work" | "personal" | "free"
  description?: string
}

function getEventStyles(category: string) {
  switch (category) {
    case "classes":
      return "event-classes"
    case "deadlines":
      return "event-deadlines"
    case "work":
      return "event-work"
    case "personal":
      return "event-personal"
    case "free":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-card"
  }
}

function nextEventAndDelta(events: UIEvent[]) {
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  for (const e of events) {
    const [h, m] = e.time.split(":").map(Number)
    const t = h * 60 + m
    if (t >= cur) {
      const d = t - cur
      const h2 = Math.floor(d / 60)
      const m2 = d % 60
      const parts: string[] = []
      if (h2) parts.push(`${h2}h`)
      if (m2) parts.push(`${m2}m`)
      return { e, delta: parts.join(" ") || "now" }
    }
  }
  return { e: events[0], delta: "" }
}

export function DashboardView() {
  const [events, setEvents] = useState<UIEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [editInitial, setEditInitial] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
        const rows = await listEventsBetween(start.toISOString(), end.toISOString())
        const mapped: UIEvent[] = rows.map((r) => {
          const s = new Date(r.start_ts)
          const e = new Date(r.end_ts)
          const pad = (n: number) => String(n).padStart(2, "0")
          const time = `${pad(s.getHours())}:${pad(s.getMinutes())}`
          const endTime = `${pad(e.getHours())}:${pad(e.getMinutes())}`
          const catMap: Record<string, UIEvent["category"]> = {
            class: "classes",
            assignment: "deadlines",
            exam: "deadlines",
            work: "work",
            personal: "personal",
          }
          return {
            id: r.id,
            title: r.title,
            time,
            endTime,
            location: r.location ?? "",
            category: catMap[r.category] ?? "personal",
            description: r.description ?? "",
          }
        })
        setEvents(mapped)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const off = onEventsChanged(load)
    return off
  }, [])

  const next = useMemo(() => nextEventAndDelta(events), [events])
  const formatDate = (date: Date) => date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-primary">UniSync</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md border" onClick={() => { setEditInitial(null); setOpenForm(true) }}>
            <Plus className="h-4 w-4" />
          </button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/student-avatar.png" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="p-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4">
            <div className="text-sm opacity-90 mb-1">{formatDate(new Date())}</div>
            <div className="text-lg font-semibold">
              {loading ? "Đang tải..." : next?.e ? (
                <>Tiếp theo: {next.e.title}{next.delta ? ` trong ${next.delta}` : ""}</>
              ) : (
                "Không có sự kiện"
              )}
            </div>
            {next?.e?.location && (
              <div className="flex items-center gap-1 text-sm opacity-90 mt-1">
                <MapPin className="h-3 w-3" />
                {next.e.location}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="relative">
          <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start gap-4">
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className="text-sm font-medium text-muted-foreground">{event.time}</div>
                  {event.endTime !== event.time && <div className="text-xs text-muted-foreground">{event.endTime}</div>}
                </div>

                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full border-2 border-background ${event.category === "free" ? "bg-muted" : "bg-primary"}`}></div>
                </div>

                <Card
                  className={`flex-1 ${getEventStyles(event.category)}`}
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10)
                    setEditInitial({
                      id: event.id,
                      title: event.title,
                      date: today,
                      startTime: event.time,
                      endTime: event.endTime,
                      category: (event.category === 'classes' ? 'class' : event.category === 'deadlines' ? 'assignment' : (event.category as any)),
                      location: event.location,
                      description: event.description,
                    })
                    setOpenForm(true)
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{event.title}</h3>
                        {event.description && <p className="text-xs opacity-90 mt-1">{event.description}</p>}
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {event.category === "classes" && "Lớp học"}
                        {event.category === "deadlines" && "Deadline"}
                        {event.category === "work" && "Công việc"}
                        {event.category === "personal" && "Cá nhân"}
                        {event.category === "free" && "Rảnh"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EventFormModal open={openForm} onClose={() => setOpenForm(false)} initial={editInitial || {}} />
    </div>
  )
}

