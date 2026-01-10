"use client"

export function NavigationSkeleton() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-[300] bg-[#080808] border-b border-[#1a1a1a]">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="relative h-16 flex items-center justify-between gap-6">
                    {/* Logo skeleton */}
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="hidden lg:block w-20 h-6 rounded bg-[#1a1a1a] animate-pulse" />
                    </div>

                    {/* Navigation links skeleton - hidden on mobile */}
                    <div className="hidden burger:flex items-center gap-4">
                        <div className="w-16 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="w-20 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="w-14 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="w-24 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="w-14 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                        <div className="w-16 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                    </div>

                    {/* Right side skeleton - search and profile */}
                    <div className="hidden burger:flex items-center gap-3">
                        {/* Search button skeleton */}
                        <div className="hidden 2xl:flex w-[360px] h-8 rounded-md bg-[#1a1a1a] animate-pulse" />
                        <div className="hidden xl:flex 2xl:hidden w-8 h-8 rounded-md bg-[#1a1a1a] animate-pulse" />

                        {/* Profile skeleton */}
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] animate-pulse" />
                            <div className="flex flex-col gap-1">
                                <div className="w-24 h-4 rounded bg-[#1a1a1a] animate-pulse" />
                                <div className="w-16 h-3 rounded bg-[#1a1a1a] animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu button skeleton */}
                    <div className="burger:hidden">
                        <div className="w-10 h-10 rounded bg-[#1a1a1a] animate-pulse" />
                    </div>
                </div>
            </div>
        </nav>
    )
}
