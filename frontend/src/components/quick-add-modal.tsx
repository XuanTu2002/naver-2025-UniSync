"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import { Mic, Send, Calendar, Clock, MapPin, BookOpen } from "lucide-react"
import { createEvent, type EventCategory } from "../lib/supabase"
import { emitEventsChanged } from "../lib/events-bus"

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedEvent, setParsedEvent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const parseInput = async (text: string) => {
    try {
      setError(null)
      setIsProcessing(true)
      const res = await fetch("/api/parse-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      // Force current year if user didn't specify a year
      const hasYearInText = /(19|20)\d{2}/.test(text)
      const nowYear = new Date().getFullYear()
      const start = data.start_ts ? new Date(data.start_ts) : new Date()
      const end = data.end_ts ? new Date(data.end_ts) : new Date(start.getTime() + 60 * 60 * 1000)
      if (!hasYearInText) {
        if (start.getFullYear() !== nowYear) start.setFullYear(nowYear)
        if (end.getFullYear() !== nowYear) end.setFullYear(nowYear)
      }
      const toLocalDate = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      }

      setParsedEvent({
        title: data.title ?? "Sự kiện",
        date: toLocalDate(start),
        time: start.toTimeString().slice(0, 5),
        endTime: end ? end.toTimeString().slice(0, 5) : "",
        location: data.location ?? "",
        category: (data.category as EventCategory) ?? "personal",
        start_ts: start.toISOString(),
        end_ts: end.toISOString(),
      })
    } catch (e) {
      setError("Không thể phân tích. Thử lại hoặc nhập thủ công.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = () => {
    if (input.trim()) {
      parseInput(input)
    }
  }

  const handleSave = async () => {
    if (!parsedEvent) return
    try {
      setIsProcessing(true)
      const startISO = new Date(`${parsedEvent.date}T${parsedEvent.time}:00`).toISOString()
      const endISO = parsedEvent.endTime && parsedEvent.endTime.length > 0
        ? new Date(`${parsedEvent.date}T${parsedEvent.endTime}:00`).toISOString()
        : new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString()
      await createEvent({
        title: parsedEvent.title,
        category: parsedEvent.category as EventCategory,
        start_ts: startISO,
        end_ts: endISO,
        location: parsedEvent.location ?? null,
        description: null,
      })
      emitEventsChanged()
      onClose()
      setInput("")
      setParsedEvent(null)
    } catch (e) {
      setError("Lưu sự kiện thất bại")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm sự kiện nhanh</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!parsedEvent ? (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Thêm sự kiện bằng tiếng Việt..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <Button size="icon" variant="outline" disabled>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={handleSubmit} disabled={!input.trim() || isProcessing}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {isProcessing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Đang xử lý...</p>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Ví dụ:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("Họp nhóm AI ngày mai 2 giờ chiều tại thư viện")}
                  >
                    "Họp nhóm AI ngày mai 2 giờ chiều tại thư viện"
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <Input
                        value={parsedEvent.title}
                        onChange={(e) => setParsedEvent({ ...parsedEvent, title: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <Input
                        type="date"
                        value={parsedEvent.date}
                        onChange={(e) => setParsedEvent({ ...parsedEvent, date: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <Input
                        type="time"
                        value={parsedEvent.time}
                        onChange={(e) => setParsedEvent({ ...parsedEvent, time: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <Input
                        type="time"
                        placeholder="Giờ kết thúc (tuỳ chọn)"
                        value={parsedEvent.endTime || ''}
                        onChange={(e) => setParsedEvent({ ...parsedEvent, endTime: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <Input
                        value={parsedEvent.location}
                        onChange={(e) => setParsedEvent({ ...parsedEvent, location: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setParsedEvent(null)} className="flex-1">
                  Chỉnh sửa
                </Button>
                <Button onClick={handleSave} className="flex-1" disabled={isProcessing}>
                  Lưu sự kiện
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

