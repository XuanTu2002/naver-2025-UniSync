"use client"

import { useState } from "react"
import { DashboardView } from "./components/dashboard-view"
import { WeeklyView } from "./components/weekly-view"
import { DeadlineView } from "./components/deadline-view"
import { BottomNavigation } from "./components/bottom-navigation"
import { QuickAddModal } from "./components/quick-add-modal"

type ViewType = "dashboard" | "weekly" | "deadlines"

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />
      case "weekly":
        return <WeeklyView />
      case "deadlines":
        return <DeadlineView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{renderCurrentView()}</main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
        onQuickAdd={() => setShowQuickAdd(true)}
      />

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </div>
  )
}

export default App
