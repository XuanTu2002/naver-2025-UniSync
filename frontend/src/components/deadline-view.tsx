import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Clock, AlertCircle } from "lucide-react"
import { listEventsBetween } from "../lib/supabase"
import { onEventsChanged } from "../lib/events-bus"
import { EventFormModal } from "./event-form-modal"
import { useEffect, useState } from "react"

type Deadline = { id: string; title: string; dueDate: string; daysLeft: number; priority: "high" | "medium" | "low" }

function localDateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function groupDeadlines(rows: any[]): { thisWeek: Deadline[]; nextWeek: Deadline[]; future: Deadline[] } {
  const now = new Date()
  const startOfWeek = new Date(now)
  const day = (now.getDay() + 6) % 7
  startOfWeek.setDate(now.getDate() - day)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000)
  const endOfNextWeek = new Date(startOfWeek.getTime() + 14 * 86400000)

  const deadlines: Deadline[] = rows
    .filter((r) => r.category === "assignment" || r.category === "exam")
    .map((r) => {
      const d = new Date(r.start_ts)
      const todayKey = localDateKey(now)
      const dueKey = localDateKey(d)
      let daysLeft: number
      if (dueKey === todayKey) {
        daysLeft = 0
      } else {
        const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        daysLeft = Math.round((dueDay.getTime() - startDay.getTime()) / 86400000)
      }
      const priority: Deadline["priority"] = daysLeft <= 3 ? "high" : daysLeft <= 7 ? "medium" : "low"
      return { id: r.id, title: r.title, dueDate: localDateKey(d), daysLeft: Math.max(daysLeft, 0), priority }
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return {
    thisWeek: deadlines.filter((d) => new Date(d.dueDate) < endOfWeek),
    nextWeek: deadlines.filter((d) => new Date(d.dueDate) >= endOfWeek && new Date(d.dueDate) < endOfNextWeek),
    future: deadlines.filter((d) => new Date(d.dueDate) >= endOfNextWeek),
  }
}

function DeadlineCard({ deadline }: { deadline: Deadline }) {
  const getPriorityColor = (p: Deadline["priority"]) => (p === "high" ? "bg-red-500" : p === "medium" ? "bg-yellow-500" : "bg-green-500")
  const getUrgencyText = (days: number) => (days === 0 ? "Hôm nay" : days === 1 ? "Ngày mai" : `${days} ngày nữa`)
  return (
    <Card className="mb-3 border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold">{deadline.title}</h3>
          </div>
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(deadline.priority)}`}></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{deadline.dueDate}</span>
          </div>
          <Badge variant={deadline.daysLeft <= 3 ? "destructive" : "secondary"} className="text-xs">
            {deadline.daysLeft <= 3 && <AlertCircle className="h-3 w-3 mr-1" />}
            {getUrgencyText(deadline.daysLeft)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function DeadlineView() {
  const [groups, setGroups] = useState<{ thisWeek: Deadline[]; nextWeek: Deadline[]; future: Deadline[] }>({
    thisWeek: [],
    nextWeek: [],
    future: [],
  })
  const [openForm, setOpenForm] = useState(false)
  const [initial, setInitial] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const end = new Date(start.getTime() + 30 * 86400000)
      const rows = await listEventsBetween(start.toISOString(), end.toISOString())
      setGroups(groupDeadlines(rows))
    }
    load()
    const off = onEventsChanged(load)
    return off
  }, [])

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 bg-card border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deadline Tracker</h1>
          <p className="text-sm text-muted-foreground">Quản lý các deadline quan trọng</p>
        </div>
        <button
          className="p-2 rounded-md border"
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10)
            setInitial({ title: '', date: today, startTime: '23:59', category: 'assignment' })
            setOpenForm(true)
          }}
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4 min-w-full">
          <div className="flex-1 min-w-[280px]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Tuần này ({groups.thisWeek.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">{groups.thisWeek.map((d) => (
                <div key={d.id} onClick={() => { setInitial({ id: d.id, title: d.title, date: d.dueDate, startTime: '23:59', category: 'assignment' }); setOpenForm(true) }}>
                  <DeadlineCard deadline={d} />
                </div>
              ))}</CardContent>
            </Card>
          </div>
          <div className="flex-1 min-w-[280px]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Tuần sau ({groups.nextWeek.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">{groups.nextWeek.map((d) => (
                <div key={d.id} onClick={() => { setInitial({ id: d.id, title: d.title, date: d.dueDate, startTime: '23:59', category: 'assignment' }); setOpenForm(true) }}>
                  <DeadlineCard deadline={d} />
                </div>
              ))}</CardContent>
            </Card>
          </div>
          <div className="flex-1 min-w-[280px]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Tương lai ({groups.future.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">{groups.future.map((d) => (
                <div key={d.id} onClick={() => { setInitial({ id: d.id, title: d.title, date: d.dueDate, startTime: '23:59', category: 'assignment' }); setOpenForm(true) }}>
                  <DeadlineCard deadline={d} />
                </div>
              ))}</CardContent>
            </Card>
          </div>
        </div>
      </div>
      <EventFormModal open={openForm} onClose={() => setOpenForm(false)} initial={initial || {}} />
    </div>
  )
}
