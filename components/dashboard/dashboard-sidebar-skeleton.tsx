"use client"

export function DashboardSidebarSkeleton() {
    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[250px] bg-[#080808] hidden lg:flex flex-col z-40">
            <div className="flex-1 p-5 space-y-6">
                <div className="space-y-1">
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-[#1a1a1a] animate-pulse" />
                </div>
            </div>
        </aside>
    )
}
