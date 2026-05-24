"use client"

import {
  QUIZ_COUNT_LABEL,
  VIDEO_SOLUTIONS_LABEL,
  TESTIMONIALS_COUNT,
} from "@/lib/platform-marketing"

type LiveStatsProps = {
    variant?: "dark" | "light"
}

export function LiveStats({ variant = "dark" }: LiveStatsProps) {
    const isLight = variant === "light"
    const labelClassName = isLight ? "text-gray-600" : "text-gray-300"
    const valueClassName = isLight ? "text-gray-900" : "text-white"

    return (
        <div className="scroll-animate-fade-up flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 lg:justify-start">
            <div className="flex items-center gap-2">
                <span className={`${labelClassName} text-sm font-medium`}>
                    <span className={`${valueClassName} font-semibold`}>{QUIZ_COUNT_LABEL}</span>
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`${labelClassName} text-sm font-medium`}>
                    <span className={`${valueClassName} font-semibold`}>{VIDEO_SOLUTIONS_LABEL}</span>
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`${labelClassName} text-sm font-medium`}>
                    <span className={`${valueClassName} font-semibold`}>{TESTIMONIALS_COUNT} testimoniale</span>
                </span>
            </div>
        </div>
    )
}
