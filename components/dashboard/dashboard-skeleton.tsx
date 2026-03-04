"use client"

export function DashboardSkeleton() {
    return (
        <div className="flex-1 lg:ml-[250px] relative h-[calc(100vh-4rem)] mt-16 transition-all duration-300 bg-[#ffffff]">
            <div className="absolute inset-[3px] bg-[#f8f9fa] lg:rounded-xl overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto dashboard-scrollbar bg-[#f8f9fa]">
                    <main className="p-4 md:p-8 lg:p-10">
                        <div className="max-w-[1000px] mx-auto">
                            {/* Header skeleton */}
                            <div className="mb-8">
                                <div className="h-9 w-72 mb-2 rounded-md bg-gray-200 animate-pulse" />
                                <div className="h-5 w-56 rounded-md bg-gray-200 animate-pulse" />
                            </div>

                            {/* Problem of the day card skeleton */}
                            <div className="mb-3 md:mb-6">
                                <div className="h-40 w-full rounded-xl bg-gray-200 animate-pulse" />
                            </div>

                            {/* Quick actions row skeleton */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-6">
                                <div className="h-20 rounded-xl bg-gray-200 animate-pulse" />
                                <div className="h-20 rounded-xl bg-gray-200 animate-pulse" />
                                <div className="h-20 rounded-xl bg-gray-200 animate-pulse" />
                                <div className="h-20 rounded-xl bg-gray-200 animate-pulse" />
                            </div>

                            {/* Main cards grid skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-3 md:mb-6">
                                <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
                                <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
                            </div>

                            {/* Secondary cards grid skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-3 md:mb-6">
                                <div className="h-48 rounded-xl bg-gray-200 animate-pulse" />
                                <div className="h-48 rounded-xl bg-gray-200 animate-pulse" />
                            </div>

                            {/* Bottom row skeleton */}
                            <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                                <div className="flex-[2] h-40 rounded-xl bg-gray-200 animate-pulse" />
                                <div className="flex-[3] h-40 rounded-xl bg-gray-200 animate-pulse" />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
