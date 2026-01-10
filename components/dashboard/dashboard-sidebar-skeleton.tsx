"use client"

export function DashboardSidebarSkeleton() {
    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[250px] bg-[#080808] hidden lg:flex flex-col z-40">
            {/* Navigation items skeleton */}
            <div className="flex-1 p-5 space-y-6">
                {/* Main Navigation skeleton */}
                <div className="space-y-1">
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                </div>

                {/* Today section skeleton */}
                <div className="space-y-3">
                    <div className="h-3 w-12 rounded bg-[#1a1a1a] animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-4 w-40 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="h-4 w-32 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="h-4 w-36 rounded bg-[#1a1a1a] animate-pulse" />
                    </div>
                </div>

                {/* Continue Learning skeleton */}
                <div className="space-y-3">
                    <div className="h-3 w-28 rounded bg-[#1a1a1a] animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-4 w-44 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="h-4 w-40 rounded bg-[#1a1a1a] animate-pulse" />
                    </div>
                </div>

                {/* Tasks Today skeleton */}
                <div className="space-y-3">
                    <div className="h-3 w-20 rounded bg-[#1a1a1a] animate-pulse" />
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                            <div className="h-4 w-32 rounded bg-[#1a1a1a] animate-pulse" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                            <div className="h-4 w-28 rounded bg-[#1a1a1a] animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Invite Friend Card skeleton */}
            <div className="p-4 border-t border-white/5 bg-[#080808]">
                <div className="border border-[#1a1a1a] rounded-xl p-3">
                    <div className="h-4 w-28 rounded bg-[#1a1a1a] animate-pulse mb-2" />
                    <div className="h-3 w-full rounded bg-[#1a1a1a] animate-pulse" />
                    <div className="h-3 w-3/4 rounded bg-[#1a1a1a] animate-pulse mt-1" />
                </div>
            </div>
        </aside>
    )
}
