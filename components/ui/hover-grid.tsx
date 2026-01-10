"use client"

import React, { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export const HoverGrid = ({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return

        const { clientX, clientY } = e
        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top

        // Iterate over children and set their individual --mouse-x and --mouse-y
        const cards = containerRef.current.getElementsByClassName("hover-card")

        for (const card of Array.from(cards)) {
            const cardRect = card.getBoundingClientRect()
            const cardX = clientX - cardRect.left
            const cardY = clientY - cardRect.top

                ; (card as HTMLElement).style.setProperty("--mouse-x", `${cardX}px`)
                ; (card as HTMLElement).style.setProperty("--mouse-y", `${cardY}px`)
        }
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className={cn("relative", className)}
        >
            {children}
        </div>
    )
}

export const HoverCard = ({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) => {
    return (
        <div
            className={cn(
                "hover-card relative h-full w-full rounded-3xl overflow-hidden bg-transparent group",
                className
            )}
        >
            {/* Spot light effect layer for the border - sits behind everything */}
            <div
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
                style={{
                    background: `radial-gradient(
                    1200px circle at var(--mouse-x) var(--mouse-y),
                    rgba(255, 100, 0, 1.0),
                    transparent 40%
                )`
                }}
            />

            {/* Card Background Mask - inset by 1px to create the border effect
            We use absolute positioning here but it must sit BEHIND the content 
        */}
            <div className="absolute inset-[1px] rounded-3xl bg-[#111111] z-0" />

            {/* Inner Highlight - inside the mask (z-0 but on top of the bg color) */}
            <div
                className="absolute inset-[1px] rounded-3xl pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100 z-0 mix-blend-screen"
                style={{
                    background: `radial-gradient(
                    1000px circle at var(--mouse-x) var(--mouse-y),
                    rgba(255, 255, 255, 0.05),
                    transparent 40%
                )`
                }}
            />

            {/* Content - Must be RELATIVE to keep flow and determine height
            And z-index > 0 to sit on top of the absolute background
        */}
            <div className="relative z-10 h-full p-[1px]">
                {/* We add p-[1px] or use the content directly. 
                 The content needs no padding if it fills the space? 
                 Actually, if we inset the background by 1px, the content should probably match size 
                 OR sit inside that 1px boundary.
                 If `children` is a card with its own padding/border, we might double up.
                 But here, the children are `ProblemCard` which has padding.
                 Let's just ensure it sits above.
            */}
                {children}
            </div>
        </div>
    )
}
