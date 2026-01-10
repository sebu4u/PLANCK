'use client'

import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { BacYearGroup, BacSubjectSummary, BacSubject, getBacSubjectById } from '@/lib/supabase-bac'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components
const BacSidebar = lazy(() => import('@/components/bac-sidebar').then(m => ({ default: m.BacSidebar })))
const BacPdfViewer = lazy(() => import('@/components/bac-pdf-viewer').then(m => ({ default: m.BacPdfViewer })))

interface BacSimulationsClientProps {
    yearGroups: BacYearGroup[]
    allSubjects: BacSubjectSummary[]
}

export function BacSimulationsClient({ yearGroups, allSubjects }: BacSimulationsClientProps) {
    const [currentSubject, setCurrentSubject] = useState<BacSubject | null>(null)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const [isSubjectLoading, setIsSubjectLoading] = useState(false)
    const subjectCache = useRef<Map<string, BacSubject>>(new Map())

    // Block scroll when mobile sidebar is shown
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
            document.documentElement.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
            document.documentElement.style.overflow = 'unset'
        }
    }, [isMobileSidebarOpen])

    // Skeletons
    const SidebarSkeleton = () => (
        <div className="w-full lg:w-80 h-full lg:h-[calc(100vh-4rem)] overflow-y-auto flex-shrink-0 lg:block">
            <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 lg:h-6 w-32 lg:w-44 bg-white/10" />
                    <Skeleton className="h-5 lg:h-6 w-5 lg:w-6 rounded bg-white/10" />
                </div>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-2 lg:p-3 space-y-2 lg:space-y-3">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Skeleton className="h-4 lg:h-5 w-4 lg:w-5 rounded bg-white/10" />
                            <Skeleton className="h-4 lg:h-5 w-32 lg:w-48 bg-white/10" />
                        </div>
                        <div className="space-y-1 lg:space-y-2 pl-5 lg:pl-7">
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="flex items-center gap-2 lg:gap-3">
                                    <Skeleton className="h-4 lg:h-5 w-4 lg:w-5 rounded bg-white/10" />
                                    <Skeleton className={`h-3 lg:h-4 bg-white/10 ${j % 3 === 0 ? 'w-40 lg:w-56' : j % 3 === 1 ? 'w-32 lg:w-44' : 'w-48 lg:w-64'}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    // Helper: fetch subject detail by id with cache
    const fetchSubjectById = async (subjectId: string, options?: { silent?: boolean }): Promise<BacSubject | null> => {
        if (subjectCache.current.has(subjectId)) {
            return subjectCache.current.get(subjectId) as BacSubject
        }
        try {
            if (!options?.silent) setIsSubjectLoading(true)
            const data = await getBacSubjectById(subjectId)
            if (data) {
                subjectCache.current.set(subjectId, data)
                return data
            }
        } catch (e) {
            console.error('Failed to fetch subject by id', subjectId, e)
        } finally {
            if (!options?.silent) setIsSubjectLoading(false)
        }
        return null
    }

    const handleSubjectSelect = (subject: BacSubjectSummary) => {
        // Fetch detaliile subiectului selectat
        fetchSubjectById(subject.id).then((detail) => {
            if (detail) setCurrentSubject(detail)
        })

        // Închide sidebar-ul pe mobil
        setIsMobileSidebarOpen(false)
    }



    return (
        <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-[#101010]">

            {/* Main Content */}
            <div className="flex relative h-full">
                {/* Mobile Menu Button */}
                {!isMobileSidebarOpen && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="fixed right-4 top-20 z-[90] lg:hidden bg-[#101010] border-white/20 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/10"
                        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    >
                        <Menu className="w-4 h-4 animate-in zoom-in duration-200" />
                    </Button>
                )}

                {/* Mobile Sidebar Overlay */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-[350] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* Sidebar - Desktop & Mobile */}
                <div className={`
                    ${isMobileSidebarOpen
                        ? 'fixed inset-y-0 right-0 z-[360] w-4/5 block animate-in slide-in-from-right duration-300 ease-out bg-[#101010]'
                        : 'hidden lg:block h-full z-10'
                    }
                `}>
                    <Suspense fallback={<SidebarSkeleton />}>
                        <BacSidebar
                            yearGroups={yearGroups}
                            currentSubjectId={currentSubject?.id}
                            onSubjectSelect={handleSubjectSelect}
                            onClose={() => setIsMobileSidebarOpen(false)}
                        />
                    </Suspense>
                </div>

                {/* Main Content Area with Rounded Corners and Margins */}
                <div className="flex-1 lg:ml-0 h-full overflow-hidden pr-[3px] pb-[3px]">
                    <Suspense fallback={
                        <div className="flex-1 h-full bg-[#323232] rounded-l-2xl animate-pulse" />
                    }>
                        <BacPdfViewer
                            subject={currentSubject}
                            isLoading={isSubjectLoading}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
