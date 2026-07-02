"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Users } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import { ChildLeaderboardCard } from "@/components/dashboard/parent/child-leaderboard-card"
import { ChildStatsCard } from "@/components/dashboard/parent/child-stats-card"
import { EstimatedGradeChartCard } from "@/components/dashboard/parent/estimated-grade-chart-card"
import { RecentWorkCard } from "@/components/dashboard/parent/recent-work-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { ChildProgressSnapshot } from "@/lib/parent/server"
import { supabase } from "@/lib/supabaseClient"

function AddChildSection({
  inviteUrl,
  inviteLoading,
  onCopy,
  prominent = false,
}: {
  inviteUrl: string | null
  inviteLoading: boolean
  onCopy: () => void
  prominent?: boolean
}) {
  if (prominent) {
    return (
      <Card className="border-[#eceff3]">
        <CardContent className="space-y-3 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Adaugă copil</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Trimite acest link copilului. După autentificare, contul lui va fi legat de al tău.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3 text-sm text-[#374151]">
              {inviteLoading ? "Se generează link-ul..." : inviteUrl ?? "Link indisponibil"}
            </div>
            <Button type="button" variant="outline" onClick={onCopy} disabled={!inviteUrl}>
              <Copy className="mr-2 h-4 w-4" />
              Copiază link
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="border-t border-[#eceff3] pt-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sm font-medium text-[#6b7280]">Adaugă un elev nou</h2>
        <p className="mt-1 text-xs text-[#9ca3af]">
          Trimite link-ul de invitație copilului tău ca să îl conectezi la contul tău de părinte.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="w-full max-w-md rounded-xl border border-[#eceff3] bg-[#fafafa] px-4 py-2.5 text-sm text-[#6b7280]">
            {inviteLoading ? "Se generează link-ul..." : inviteUrl ?? "Link indisponibil"}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[#6b7280]"
            onClick={onCopy}
            disabled={!inviteUrl}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiază link
          </Button>
        </div>
      </div>
    </section>
  )
}

function ChildDashboardGrid({
  child,
  onTargetGradeChange,
}: {
  child: ChildProgressSnapshot
  onTargetGradeChange: (childId: string, value: number) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <EstimatedGradeChartCard
        childId={child.child_id}
        estimatedGrade={child.estimated_grade}
        targetGrade={child.target_grade}
        onTargetGradeChange={(value) => onTargetGradeChange(child.child_id, value)}
      />
      <ChildLeaderboardCard childName={child.name} elo={child.stats.elo} />
      <RecentWorkCard recentWork={child.recent_work} />
      <ChildStatsCard stats={child.stats} />
    </div>
  )
}

export function ParentDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading, profile, isParent } = useAuth()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<ChildProgressSnapshot[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const parentName = profile?.nickname?.trim() || profile?.name?.trim() || "părinte"

  const userData = useMemo(
    () => ({
      id: user?.id ?? "",
      email: user?.email ?? "",
      avatar_url: profile?.user_icon,
      username: profile?.nickname || profile?.name,
    }),
    [user?.id, user?.email, profile?.user_icon, profile?.nickname, profile?.name],
  )

  const selectedChild = useMemo(
    () => children.find((child) => child.child_id === selectedChildId) ?? children[0] ?? null,
    [children, selectedChildId],
  )

  const fetchInvite = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) return

    setInviteLoading(true)
    try {
      const response = await fetch("/api/parent/invite", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("invite_failed")
      const payload = await response.json()
      setInviteUrl(payload.connect_url ?? null)
    } catch {
      toast({
        title: "Nu am putut genera invitația",
        description: "Încearcă din nou peste câteva secunde.",
        variant: "destructive",
      })
    } finally {
      setInviteLoading(false)
    }
  }, [toast])

  const fetchChildren = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch("/api/parent/children-progress", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("children_failed")
      const payload = await response.json()
      const nextChildren = Array.isArray(payload.children) ? payload.children : []
      setChildren(nextChildren)
      setSelectedChildId((current) => {
        if (current && nextChildren.some((child: ChildProgressSnapshot) => child.child_id === current)) {
          return current
        }
        return nextChildren[0]?.child_id ?? null
      })
    } catch {
      toast({
        title: "Nu am putut încărca progresul copiilor",
        description: "Reîncarcă pagina sau încearcă mai târziu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/")
      return
    }
    if (!isParent) {
      router.replace("/dashboard")
      return
    }
    void fetchInvite()
    void fetchChildren()
  }, [authLoading, user, isParent, router, fetchInvite, fetchChildren])

  const copyInviteLink = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast({
        title: "Link copiat",
        description: "Trimite link-ul copilului tău ca să se conecteze.",
      })
    } catch {
      toast({
        title: "Nu am putut copia link-ul",
        variant: "destructive",
      })
    }
  }

  const handleTargetGradeChange = useCallback((childId: string, value: number) => {
    setChildren((previous) =>
      previous.map((child) =>
        child.child_id === childId ? { ...child, target_grade: value } : child,
      ),
    )
  }, [])

  if (authLoading || loading) {
    return <LoadingVideoOverlay />
  }

  const hasChildren = children.length > 0
  const showChildTabs = children.length > 1

  return (
    <DashboardSidebarProvider>
      <div className="relative flex h-[100dvh] flex-row overflow-hidden bg-[#ffffff] pt-16">
        <DashboardClientWrapper user={userData} dashboardHomeHref="/dashboard/parent" />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#ffffff] transition-all duration-300">
          <div className="dashboard-scrollbar flex-1 overflow-y-auto bg-[#ffffff]">
            <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
              <div className="space-y-4">
                {showChildTabs ? (
                  <Tabs
                    value={selectedChild?.child_id ?? undefined}
                    onValueChange={setSelectedChildId}
                    className="w-full"
                  >
                    <TabsList className="inline-flex h-auto w-full max-w-full flex-wrap justify-start gap-1 rounded-full bg-[#f3f4f6] p-1">
                      {children.map((child) => (
                        <TabsTrigger
                          key={child.child_id}
                          value={child.child_id}
                          className="rounded-full px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm text-[#6b7280] hover:text-[#374151]"
                        >
                          {child.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                ) : null}

                <div>
                  <h1 className="text-2xl font-bold text-[#111827]">
                    Bună, {parentName}! <span aria-hidden="true">👋</span>
                  </h1>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Urmărește progresul copiilor tăi pe PLANCK.
                  </p>
                </div>
              </div>

              {!hasChildren ? (
                <>
                  <AddChildSection
                    inviteUrl={inviteUrl}
                    inviteLoading={inviteLoading}
                    onCopy={() => void copyInviteLink()}
                    prominent
                  />
                  <Card className="border-dashed border-[#d1d5db]">
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                      <Users className="h-10 w-10 text-[#9ca3af]" />
                      <p className="text-base font-medium text-[#111827]">Niciun copil conectat încă</p>
                      <p className="max-w-md text-sm text-[#6b7280]">
                        Folosește link-ul de invitație de mai sus. Copilul trebuie să aibă cont de elev.
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {selectedChild ? (
                    <ChildDashboardGrid
                      child={selectedChild}
                      onTargetGradeChange={handleTargetGradeChange}
                    />
                  ) : null}

                  <AddChildSection
                    inviteUrl={inviteUrl}
                    inviteLoading={inviteLoading}
                    onCopy={() => void copyInviteLink()}
                  />
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </DashboardSidebarProvider>
  )
}
