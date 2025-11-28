"use client"

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import Image from "next/image"
import {
  Search,
  Code,
  Pencil,
  BookOpen,
  Star,
  Sparkles,
  Users,
  Home,
  FlaskConical,
  Cpu,
  Trophy,
  Bell,
  Users2,
  Rocket,
  Calculator,
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
  recentAchievements,
  updates,
  onTaskToggle,
  open,
  onOpenChange,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
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
    { href: "/sketch", label: "Sketch", icon: <Pencil className="w-4 h-4" /> },
    { href: "/insight/chat", label: "Insight", icon: <Sparkles className="w-4 h-4" /> },
    { label: "Community", icon: <Users2 className="w-4 h-4" />, onClick: () => {} },
    { label: "Planck Space", icon: <Rocket className="w-4 h-4" />, onClick: () => {} },
  ]

  const quickAccessItems = [
    { icon: <Search className="w-4 h-4" />, label: "Search Problems", href: "/probleme" },
    { icon: <Code className="w-4 h-4" />, label: "Planck Code", href: "/planckcode" },
    { icon: <Pencil className="w-4 h-4" />, label: "Sketch", href: "/sketch/new" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Lessons", href: "/cursuri" },
    { icon: <Star className="w-4 h-4" />, label: "Saved Problems", href: "/probleme?saved=true" },
    { icon: <Sparkles className="w-4 h-4" />, label: "Ask Insight", href: "/insight/chat" },
    { icon: <Users className="w-4 h-4" />, label: "Clasa Mea", href: "/clasa" },
  ]

  // Get rank icon path (extract rank name from full rank string, e.g., "Bronze III" -> "bronze")
  const getRankIconPath = (rankName: string): string => {
    const rankLower = rankName.toLowerCase()
    if (rankLower.includes('bronze')) return '/ranks/bronze.png'
    if (rankLower.includes('silver')) return '/ranks/silver.png'
    if (rankLower.includes('gold')) return '/ranks/gold.png'
    if (rankLower.includes('platinum')) return '/ranks/platinum.png'
    if (rankLower.includes('diamond')) return '/ranks/diamond.png'
    if (rankLower.includes('masters')) return '/ranks/masters.png'
    if (rankLower.includes('ascendant')) return '/ranks/ascendant.png'
    if (rankLower.includes('singularity')) return '/ranks/singularity.png'
    return '/ranks/bronze.png' // Default fallback
  }

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
      <h4 className="text-xs uppercase tracking-wider text-white/50 font-semibold">Tasks Today</h4>
      <div className="space-y-2">
        {localTasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            <Checkbox
              checked={task.is_completed}
              onCheckedChange={() => handleTaskToggle(task.id)}
              className="border-white/30 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
            <span
              className={`text-sm ${
                task.is_completed ? 'line-through text-white/50' : 'text-white/80'
              }`}
            >
              {task.task_description}
            </span>
          </div>
        ))}
      </div>
    </div>
  ), [localTasks, handleTaskToggle])

  // Memoize user info to prevent unnecessary re-renders
  const userDisplayName = useMemo(() => user.username || user.email.split('@')[0], [user.username, user.email])
  const userInitial = useMemo(() => user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase(), [user.username, user.email])
  const rankIconPath = useMemo(() => getRankIconPath(stats.rank), [stats.rank])
  const eloToNextRank = useMemo(() => Math.max(0, 600 - stats.elo), [stats.elo])

  const SidebarContent = () => (
    <ScrollArea ref={scrollAreaRef} className="h-full dashboard-scrollbar">
      <div className="p-5 space-y-6">
        {/* Section 1: User Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-white/8">
          <Avatar className="w-10 h-10 border border-white/10">
            <AvatarImage src={user.avatar_url} key={user.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">
              {userDisplayName}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-white/70">
                {stats.rank} · {stats.elo} ELO
              </p>
              <Image
                src={rankIconPath}
                alt={stats.rank}
                width={16}
                height={16}
                className="object-contain"
                onError={(e) => {
                  // Hide image if it fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            <p className="text-xs text-white/60">
              +{eloToNextRank} până la Silver I
            </p>
          </div>
        </div>

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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white/10 text-white/100'
                        : 'text-white/70 hover:bg-white/6 hover:text-white/90'
                    }`}
                  >
                    {link.icon}
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                </Link>
              )
            }
            
            // Insert mobile-only "Probleme" button as 2nd item (after Dashboard, before Sketch)
            if (index === 1 && link.href === "/sketch") {
              const problemeIsActive = pathname === "/probleme"
              return [
                // Mobile-only Probleme button
                <Link key="probleme-mobile" href="/probleme" className="lg:hidden block">
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      problemeIsActive
                        ? 'bg-white/10 text-white/100'
                        : 'text-white/70 hover:bg-white/6 hover:text-white/90'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span className="text-sm font-medium">Probleme</span>
                  </div>
                </Link>,
                // Original Sketch link
                <Link key={key} href={link.href!}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white/10 text-white/100'
                        : 'text-white/70 hover:bg-white/6 hover:text-white/90'
                    }`}
                  >
                    {link.icon}
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                </Link>
              ]
            }
            
            if (link.onClick) {
              // Button that does nothing on click
              return (
                <button
                  key={key}
                  onClick={link.onClick}
                  className="w-full text-left"
                >
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white/70 hover:bg-white/6 hover:text-white/90"
                  >
                    {link.icon}
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                </button>
              )
            }
            
            return (
              <Link key={key} href={link.href!}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white/10 text-white/100'
                      : 'text-white/70 hover:bg-white/6 hover:text-white/90'
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
          <h4 className="text-xs uppercase tracking-wider text-white/50 font-semibold">Today</h4>
          <div className="space-y-2 text-sm text-white/85">
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
            <h4 className="text-xs uppercase tracking-wider text-white/50 font-semibold">Continue Learning</h4>
            <div className="space-y-2">
              {continueItems.slice(0, 3).map((item, index) => (
                <Link key={index} href={item.url}>
                  <div className="text-sm text-white/70 hover:text-white/100 hover:underline transition-colors cursor-pointer">
                    • {item.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Quick Access */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-white/50 font-semibold">Quick Access</h4>
          <div className="space-y-1">
            {quickAccessItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-white/6 hover:text-white/90 transition-all cursor-pointer">
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Section 5: Tasks Today */}
        {TasksSection}

        {/* Section 6: Achievements (mini) */}
        {recentAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-white/50 font-semibold">Achievements</h4>
            <div className="space-y-2">
              {recentAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-base">{achievement.icon}</span>
                  <span className="truncate">{achievement.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 7: Updates */}
        {updates.length > 0 && (
          <div className="space-y-3 pb-6">
            <h4 className="text-xs uppercase tracking-wider text-white/50 font-semibold">Updates</h4>
            <div className="space-y-2">
              {updates.map((update) => (
                <div key={update.id} className="flex items-start gap-2 text-sm text-white/70">
                  <Bell className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
                  <span className="text-xs leading-relaxed">{update.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Media Icons */}
        <div className="pt-6 mt-6 border-t border-white/10">
          <div className="flex items-center justify-center gap-4">
            {/* Discord */}
            <button
              onClick={() => {}}
              className="text-white/60 hover:text-white/90 transition-colors p-2 hover:bg-white/5 rounded-lg flex items-center justify-center"
              aria-label="Discord"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C2.533 6.695 2.05 8.99 1.91 11.29a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.15-2.38.64-4.652 1.32-6.84a.066.066 0 0 0-.032-.07zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </button>

            {/* Instagram */}
            <button
              onClick={() => {}}
              className="text-white/60 hover:text-white/90 transition-colors p-2 hover:bg-white/5 rounded-lg"
              aria-label="Instagram"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </button>

            {/* YouTube */}
            <button
              onClick={() => {}}
              className="text-white/60 hover:text-white/90 transition-colors p-2 hover:bg-white/5 rounded-lg"
              aria-label="YouTube"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-[300px] bg-[#080808] border-r border-[#1a1a1a] z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <div className="lg:hidden">
        <Sheet open={open ?? false} onOpenChange={onOpenChange}>
          <SheetContent side="right" className="w-[300px] bg-[#080808] border-[#1a1a1a] p-0 mt-16">
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
    prevProps.continueItems.length !== nextProps.continueItems.length ||
    prevProps.recentAchievements.length !== nextProps.recentAchievements.length ||
    prevProps.updates.length !== nextProps.updates.length
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

