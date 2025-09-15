"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { createEvent, deleteEvent, updateEvent, type EventCategory } from '../lib/supabase'
import { emitEventsChanged } from '../lib/events-bus'

export type EventFormValue = {
  id?: string
  title: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime?: string // HH:mm (optional)
  category: EventCategory
  location?: string
  description?: string
}

function todayISODate() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

const categories: { value: EventCategory; label: string }[] = [
  { value: 'class', label: 'Lớp học' },
  { value: 'assignment', label: 'Deadline' },
  { value: 'exam', label: 'Kỳ thi' },
  { value: 'work', label: 'Công việc' },
  { value: 'personal', label: 'Cá nhân' },
]

interface Props {
  open: boolean
  onClose: () => void
  initial?: Partial<EventFormValue>
}

export function EventFormModal({ open, onClose, initial }: Props) {
  const [value, setValue] = useState<EventFormValue>({
    id: initial?.id,
    title: initial?.title || '',
    date: initial?.date || todayISODate(),
    startTime: initial?.startTime || new Date().toTimeString().slice(0, 5),
    endTime: initial?.endTime,
    category: initial?.category || 'personal',
    location: initial?.location || '',
    description: initial?.description || '',
  })

  useEffect(() => {
    if (open) {
      setValue({
        id: initial?.id,
        title: initial?.title || '',
        date: initial?.date || todayISODate(),
        startTime: initial?.startTime || new Date().toTimeString().slice(0, 5),
        endTime: initial?.endTime,
        category: (initial?.category as EventCategory) || 'personal',
        location: initial?.location || '',
        description: initial?.description || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Optional end time; if empty we default to +60 minutes on save

  const save = async () => {
    const startISO = new Date(`${value.date}T${value.startTime}:00`).toISOString()
    const endISO = value.endTime && value.endTime.length > 0
      ? new Date(`${value.date}T${value.endTime}:00`).toISOString()
      : new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString()
    if (value.id) {
      await updateEvent(value.id, {
        title: value.title,
        category: value.category,
        start_ts: startISO,
        end_ts: endISO,
        location: value.location || null,
        description: value.description || null,
      })
    } else {
      await createEvent({
        title: value.title,
        category: value.category,
        start_ts: startISO,
        end_ts: endISO,
        location: value.location || null,
        description: value.description || null,
      })
    }
    emitEventsChanged()
    onClose()
  }

  const remove = async () => {
    if (!value.id) return
    await deleteEvent(value.id)
    emitEventsChanged()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{value.id ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Tiêu đề" value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} />
          <div className="flex gap-2">
            <Input type="date" value={value.date} onChange={(e) => setValue({ ...value, date: e.target.value })} />
            <select
              className="border rounded-md px-3 py-2 text-sm w-full"
              value={value.category}
              onChange={(e) => setValue({ ...value, category: e.target.value as EventCategory })}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Input type="time" value={value.startTime} onChange={(e) => setValue({ ...value, startTime: e.target.value })} />
            <Input
              type="time"
              placeholder="Giờ kết thúc (tuỳ chọn)"
              value={value.endTime || ''}
              onChange={(e) => setValue({ ...value, endTime: e.target.value })}
            />
          </div>
          <Input placeholder="Địa điểm" value={value.location} onChange={(e) => setValue({ ...value, location: e.target.value })} />
          <Input placeholder="Mô tả (tuỳ chọn)" value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} />

          <div className="flex gap-2 pt-1">
            {value.id && (
              <Button variant="outline" onClick={remove} className="flex-1">
                Xoá
              </Button>
            )}
            <Button onClick={save} className="flex-1">
              {value.id ? 'Lưu' : 'Tạo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
