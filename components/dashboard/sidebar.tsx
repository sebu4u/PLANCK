"use client"

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

import {
  BookOpen,
  Home,
  Sparkles,
  Calculator,
  ListChecks,
  GraduationCap,
  Brain,
  User,
} from "lucide-react"
import { UserStats, UserTask, DashboardUpdate, ContinueLearningItem, Achievement } from "@/lib/dashboard-data"

interface DashboardSidebarProps {
  user: {
    id: string
    email: string
    avatar_url?: string
    username?: string
  }
  stats: UserStats
  tasks: UserTask[]
  continueItems: ContinueLearningItem[]
  recentAchievements: Achievement[]
  updates: DashboardUpdate[]
  onTaskToggle?: (taskId: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function DashboardSidebarComponent({
  user,
  stats,
  tasks,
  continueItems,
  onTaskToggle,
  open,
  onOpenChange,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: "local" })
    router.refresh()
  }

  // Local state for tasks to prevent full sidebar re-render
  const [localTasks, setLocalTasks] = useState(tasks)
  const tasksRef = useRef(tasks)

  // Sync local tasks when props change (but not on every toggle)
  // Only sync if tasks from props are different (e.g., initial load or external update)
  useEffect(() => {
    // Compare with ref to avoid unnecessary updates from local toggles
    if (JSON.stringify(tasks) !== JSON.stringify(tasksRef.current)) {
      tasksRef.current = tasks
      setLocalTasks(tasks)
    }
  }, [tasks])

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    { href: "/cursuri", label: "Cursuri de fizica", icon: <BookOpen className="w-4 h-4" /> },
    { href: "/insight/chat", label: "Insight", icon: <Sparkles className="w-4 h-4" /> },
    { href: "/grile", label: "Teste Grila", icon: <ListChecks className="w-4 h-4" /> },
    { href: "/simulari-bac", label: "Simulari Bac", icon: <GraduationCap className="w-4 h-4" /> },
    { href: "/space", label: "Memorator", icon: <Brain className="w-4 h-4" /> },
  ]





  const handleTaskToggle = useCallback((taskId: string) => {
    // Save current scroll position before update
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
    const scrollTop = scrollContainer?.scrollTop || 0

    // Update local state immediately (optimistic update)
    setLocalTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, is_completed: !task.is_completed } : task
      )
    )

    // Notify parent (for database sync) without causing re-render
    onTaskToggle?.(taskId)

    // Restore scroll position after state update
    // Use double requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const updatedContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
        if (updatedContainer && updatedContainer.scrollTop !== scrollTop) {
          updatedContainer.scrollTop = scrollTop
        }
      })
    })
  }, [onTaskToggle])

  // Memoize the tasks section to prevent unnecessary re-renders
  const TasksSection = useMemo(() => (
    <div className="space-y-3">
      <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Tasks Today</h4>
      <div className="space-y-2">
        {localTasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            <Checkbox
              checked={task.is_completed}
              onCheckedChange={() => handleTaskToggle(task.id)}
              className="border-gray-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
            <span
              className={`text-sm ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
            >
              {task.task_description}
            </span>
          </div>
        ))}
      </div>
    </div>
  ), [localTasks, handleTaskToggle])



  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#ffffff]">
      <div className="flex-1 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full dashboard-scrollbar">
          <div className="p-5 space-y-6">


            {/* Main Navigation */}
            <nav className="space-y-1">
              {navLinks.map((link, index) => {
                const isActive = link.href && pathname === link.href
                const key = link.href || `nav-${index}`

                // Render Dashboard first
                if (index === 0) {
                  return (
                    <Link key={key} href={link.href!}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                      >
                        {link.icon}
                        <span className="text-sm font-medium">{link.label}</span>
                      </div>
                    </Link>
                  )
                }

                // Mobile-only "Probleme" before Insight (desktop has Probleme in top bar)
                if (link.href === "/insight/chat") {
                  const problemeIsActive = pathname === "/probleme"
                  return [
                    <Link key="probleme-mobile" href="/probleme" className="lg:hidden block">
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${problemeIsActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                      >
                        <Calculator className="w-4 h-4" />
                        <span className="text-sm font-medium">Probleme</span>
                      </div>
                    </Link>,
                    <Link key={key} href={link.href}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                      >
                        {link.icon}
                        <span className="text-sm font-medium">{link.label}</span>
                      </div>
                    </Link>,
                  ]
                }

                return (
                  <Link key={key} href={link.href!}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                      {link.icon}
                      <span className="text-sm font-medium">{link.label}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Section 2: Today Overview */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Today</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p className={Math.min(stats.problems_solved_today, 3) === 3 ? 'text-green-500 font-semibold' : ''}>
                  • {Math.min(stats.problems_solved_today, 3)}/3 probleme rezolvate
                </p>
                <p className="flex items-center gap-1">
                  • Streak: {stats.current_streak} zile 🔥
                </p>
                <p>• Timp învățat: {stats.total_time_minutes} min</p>
              </div>
            </div>

            {/* Section 3: Continue Learning */}
            {continueItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Continue Learning</h4>
                <div className="space-y-2">
                  {continueItems.slice(0, 3).map((item, index) => (
                    <Link key={index} href={item.url}>
                      <div className="text-sm text-gray-700 hover:text-gray-900 hover:underline transition-colors cursor-pointer">
                        • {item.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}



            {/* Section 5: Tasks Today */}
            {TasksSection}

            {/* Mobile Only: Profile & Sign Out Buttons */}
            <div className="lg:hidden grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/profil"
                className="col-span-1 h-10 w-full flex items-center justify-center gap-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Profil</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="col-span-1 h-10 w-full flex items-center justify-center px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
              >
                <span className="text-sm font-medium whitespace-nowrap">Sign Out</span>
              </button>
            </div>


          </div>
        </ScrollArea>
      </div>

      {/* Fixed Invite Friend Card */}
      <div className="p-4 border-t border-gray-200 bg-[#ffffff]">
        <Link href="/profil/referral">
          <div className="bg-transparent border border-gray-300 rounded-xl p-3 hover:border-blue-500/40 transition-all group cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Invită un prieten
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Primești <span className="text-gray-700 font-medium">1 lună Plus</span> gratuit pentru fiecare prieten invitat.
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-[250px] bg-[#ffffff] z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <div className="lg:hidden">
        <Sheet open={open ?? false} onOpenChange={onOpenChange}>
          <SheetContent side="right" hideClose className="w-[250px] bg-[#ffffff] border-gray-200 p-0 top-[64px] h-[calc(100dvh-64px)]">
            <SheetTitle className="sr-only">Dashboard Menu</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

// Memoize the component to prevent re-renders when props haven't changed
// The comparison function returns true if props are equal (no re-render needed)
export const DashboardSidebar = memo(DashboardSidebarComponent, (prevProps, nextProps) => {
  // Compare user object
  if (
    prevProps.user.id !== nextProps.user.id ||
    prevProps.user.avatar_url !== nextProps.user.avatar_url ||
    prevProps.user.username !== nextProps.user.username ||
    prevProps.user.email !== nextProps.user.email
  ) {
    return false // Props changed, re-render needed
  }

  // Compare stats object (only key fields that affect display)
  if (
    prevProps.stats.elo !== nextProps.stats.elo ||
    prevProps.stats.rank !== nextProps.stats.rank ||
    prevProps.stats.current_streak !== nextProps.stats.current_streak ||
    prevProps.stats.problems_solved_today !== nextProps.stats.problems_solved_today ||
    prevProps.stats.total_time_minutes !== nextProps.stats.total_time_minutes
  ) {
    return false // Props changed, re-render needed
  }

  // Compare arrays (shallow comparison for length and IDs)
  if (
    prevProps.tasks.length !== nextProps.tasks.length ||
    prevProps.continueItems.length !== nextProps.continueItems.length
  ) {
    return false // Props changed, re-render needed
  }

  // Deep compare tasks (they can be toggled)
  const tasksEqual = prevProps.tasks.every((task, idx) =>
    task.id === nextProps.tasks[idx]?.id &&
    task.is_completed === nextProps.tasks[idx]?.is_completed
  )
  if (!tasksEqual) {
    return false // Props changed, re-render needed
  }

  // Compare other props
  if (prevProps.open !== nextProps.open) {
    return false // Props changed, re-render needed
  }

  // All props are equal, no re-render needed
  return true
})

