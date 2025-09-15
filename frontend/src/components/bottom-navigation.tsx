"use client"

import { Calendar, Clock, CheckSquare, Plus } from "lucide-react"
import { Button } from "./ui/button"

interface BottomNavigationProps {
  currentView: "dashboard" | "weekly" | "deadlines"
  onViewChange: (view: "dashboard" | "weekly" | "deadlines") => void
  onQuickAdd: () => void
}

export function BottomNavigation({ currentView, onViewChange, onQuickAdd }: BottomNavigationProps) {
  return (
    <div className="flex items-center justify-around p-4 bg-card border-t border-border">
      <Button
        variant={currentView === "dashboard" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("dashboard")}
        className="flex flex-col items-center gap-1 h-auto py-2"
      >
        <Clock className="h-5 w-5" />
        <span className="text-xs">Hôm nay</span>
      </Button>

      <Button
        variant={currentView === "weekly" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("weekly")}
        className="flex flex-col items-center gap-1 h-auto py-2"
      >
        <Calendar className="h-5 w-5" />
        <span className="text-xs">Tuần</span>
      </Button>

      {/* Quick Add Button */}
      <Button onClick={onQuickAdd} size="sm" className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90">
        <Plus className="h-6 w-6" />
      </Button>

      <Button
        variant={currentView === "deadlines" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("deadlines")}
        className="flex flex-col items-center gap-1 h-auto py-2"
      >
        <CheckSquare className="h-5 w-5" />
        <span className="text-xs">Deadline</span>
      </Button>
    </div>
  )
}
