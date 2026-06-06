"use client"

import { useMemo, memo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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

interface DashboardSidebarProps {
  user: {
    id: string
    email: string
    avatar_url?: string
    username?: string
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  dashboardHomeHref?: string
  sidebarVariant?: "standard" | "dev"
}

function DashboardSidebarComponent({
  user,
  open,
  onOpenChange,
  dashboardHomeHref = "/dashboard",
  sidebarVariant = "standard",
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isDevSidebar = sidebarVariant === "dev"

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: "local" })
    router.refresh()
  }

  const navLinks = useMemo(
    () => [
      { href: dashboardHomeHref, label: "Dashboard", icon: <Home className="w-4 h-4" /> },
      { href: "/cursuri", label: "Cursuri de fizica", icon: <BookOpen className="w-4 h-4" /> },
      { href: "/insight/chat", label: "Insight", icon: <Sparkles className="w-4 h-4" /> },
      { href: "/grile", label: "Teste Grila", icon: <ListChecks className="w-4 h-4" /> },
      { href: "/simulari-bac", label: "Simulari Bac", icon: <GraduationCap className="w-4 h-4" /> },
      { href: "/space", label: "Memorator", icon: <Brain className="w-4 h-4" /> },
    ],
    [dashboardHomeHref],
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#ffffff]">
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full dashboard-scrollbar">
          <div className="p-5 space-y-6">
            {/* Main Navigation */}
            <nav className="space-y-1">
              {navLinks.map((link, index) => {
                const isActive =
                  link.href && (pathname === link.href || (index === 0 && isDevSidebar && pathname?.startsWith("/dashboard/dev")))
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
    </div>
  )

  return (
    <>
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

export const DashboardSidebar = memo(DashboardSidebarComponent, (prevProps, nextProps) => {
  if (
    prevProps.user.id !== nextProps.user.id ||
    prevProps.user.avatar_url !== nextProps.user.avatar_url ||
    prevProps.user.username !== nextProps.user.username ||
    prevProps.user.email !== nextProps.user.email
  ) {
    return false
  }

  if (prevProps.open !== nextProps.open) {
    return false
  }

  if (prevProps.dashboardHomeHref !== nextProps.dashboardHomeHref) {
    return false
  }

  if (prevProps.sidebarVariant !== nextProps.sidebarVariant) {
    return false
  }

  return true
})
