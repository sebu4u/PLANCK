"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { useDashboardSidebar } from "@/components/dashboard/dashboard-sidebar-context"
import { UserStats, UserTask, DashboardUpdate, ContinueLearningItem, Achievement } from "@/lib/dashboard-data"

interface DashboardClientWrapperProps {
  user: {
    id: string
    email: string
    avatar_url?: string
    username?: string
  }
  stats: UserStats
  initialTasks: UserTask[]
  continueItems: ContinueLearningItem[]
  recentAchievements: Achievement[]
  updates: DashboardUpdate[]
}

export function DashboardClientWrapper({
  user,
  stats,
  initialTasks,
  continueItems,
  recentAchievements,
  updates,
}: DashboardClientWrapperProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const { isOpen, setIsOpen } = useDashboardSidebar()

  const handleTaskToggle = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, is_completed: !task.is_completed } : task
      )
    )
    // TODO: Update task in database via API call
  }

  return (
    <DashboardSidebar
      user={user}
      stats={stats}
      tasks={tasks}
      continueItems={continueItems}
      recentAchievements={recentAchievements}
      updates={updates}
      onTaskToggle={handleTaskToggle}
      open={isOpen}
      onOpenChange={setIsOpen}
    />
  )
}

