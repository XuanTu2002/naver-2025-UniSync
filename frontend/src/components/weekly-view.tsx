"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { listEventsBetween } from "../lib/supabase"
import { onEventsChanged } from "../lib/events-bus"
import { EventFormModal } from "./event-form-modal"

type DayEvents = Record<string, { id: string; title: string; time: string; endTime?: string; category: string; location?: string }[]>

function getEventColor(category: string) {
  switch (category) {
    case "class":
      return "bg-chart-3"
    case "assignment":
      return "bg-chart-4"
    case "exam":
      return "bg-chart-4"
    case "work":
      return "bg-chart-5"
    case "personal":
      return "bg-primary"
    default:
      return "bg-primary"
  }
}

function startOfWeek(d = new Date()) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Mon=0
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function localDateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function WeeklyView() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek())
  const [events, setEvents] = useState<DayEvents>({})
  const [openForm, setOpenForm] = useState(false)
  const [initial, setInitial] = useState<any>(null)

  const week = useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) days.push(new Date(currentWeek.getTime() + i * 86400000))
    return days
  }, [currentWeek])

  useEffect(() => {
    const load = async () => {
      const start = new Date(currentWeek)
      const end = new Date(currentWeek.getTime() + 7 * 86400000)
      const rows = await listEventsBetween(start.toISOString(), end.toISOString())
      const grouped: DayEvents = {}
      for (const r of rows) {
        const d = new Date(r.start_ts)
        const e = new Date(r.end_ts)
        const key = localDateKey(d)
        const pad = (n: number) => String(n).padStart(2, "0")
        const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
        const endTime = `${pad(e.getHours())}:${pad(e.getMinutes())}`
        ;(grouped[key] ||= []).push({ id: r.id, title: r.title, time, endTime, category: r.category, location: r.location ?? '' })
      }
      setEvents(grouped)
    }
    load()
    const off = onEventsChanged(load)
    return off
  }, [currentWeek])

  const weekNumber = useMemo(() => {
    const d = new Date(Date.UTC(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }, [currentWeek])

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 86400000))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold">Tuần {weekNumber}</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md border" onClick={() => { setInitial(null); setOpenForm(true) }}>
            <Plus className="h-4 w-4" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 86400000))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-7 gap-2 h-full">
          {week.map((day) => {
            const key = localDateKey(day)
            const label = day.toLocaleDateString("vi-VN", { weekday: "short" })
            const dateNum = day.getDate()
            return (
              <div key={key} className="flex flex-col">
                <div className="text-center p-2 border-b border-border">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-sm font-medium">{dateNum}</div>
                </div>

                <div className="flex-1 p-1 space-y-1">
                  {(events[key] || []).map((event) => (
                    <Card key={event.id} className={`${getEventColor(event.category)} text-white`} onClick={() => {
                      setInitial({
                        id: event.id,
                        title: event.title,
                        date: key,
                        startTime: event.time,
                        endTime: event.endTime,
                        category: event.category,
                        location: event.location ?? '',
                      })
                      setOpenForm(true)
                    }}>
                      <CardContent className="p-1">
                        <div className="text-xs font-medium truncate">{event.title}</div>
                        <div className="text-xs opacity-90">{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</div>
                        {event.location && <div className="text-[11px] opacity-90 truncate">{event.location}</div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-4">
        <Button variant="outline" className="w-full bg-transparent" onClick={() => setCurrentWeek(startOfWeek(new Date()))}>
          Hôm nay
        </Button>
      </div>

      <EventFormModal open={openForm} onClose={() => setOpenForm(false)} initial={initial || {}} />
    </div>
  )
}
