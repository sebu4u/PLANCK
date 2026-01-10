"use client"

import { motion, type HTMLMotionProps, type Variants } from "framer-motion"
import { type ReactNode } from "react"

// Premium easing curves for smooth animations (typed as Framer Motion expects)
const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Base animation variants
const fadeUpVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 40,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.7,
            ease: easeOutExpo,
        },
    },
}

const fadeLeftVariants: Variants = {
    hidden: {
        opacity: 0,
        x: 40,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.7,
            ease: easeOutExpo,
        },
    },
}

const fadeRightVariants: Variants = {
    hidden: {
        opacity: 0,
        x: -40,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.7,
            ease: easeOutExpo,
        },
    },
}

const scaleInVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.92,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.7,
            ease: easeOutExpo,
        },
    },
}

// Stagger container variants
const staggerContainerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
}

// Common props for scroll animations
interface ScrollAnimationProps extends Omit<HTMLMotionProps<"div">, "initial" | "whileInView" | "viewport" | "variants"> {
    children: ReactNode
    delay?: number
    duration?: number
    className?: string
    once?: boolean
    amount?: number | "some" | "all"
}

// FadeInUp - Most common animation, fades in and slides up
export function FadeInUp({
    children,
    delay = 0,
    duration,
    className = "",
    once = true,
    amount = 0.2,
    ...props
}: ScrollAnimationProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={{
                hidden: fadeUpVariants.hidden,
                visible: {
                    ...fadeUpVariants.visible,
                    transition: {
                        duration: duration ?? 0.7,
                        delay,
                        ease: easeOutExpo,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// FadeInLeft - Slides in from the right
export function FadeInLeft({
    children,
    delay = 0,
    duration,
    className = "",
    once = true,
    amount = 0.2,
    ...props
}: ScrollAnimationProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={{
                hidden: fadeLeftVariants.hidden,
                visible: {
                    ...fadeLeftVariants.visible,
                    transition: {
                        duration: duration ?? 0.7,
                        delay,
                        ease: easeOutExpo,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// FadeInRight - Slides in from the left
export function FadeInRight({
    children,
    delay = 0,
    duration,
    className = "",
    once = true,
    amount = 0.2,
    ...props
}: ScrollAnimationProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={{
                hidden: fadeRightVariants.hidden,
                visible: {
                    ...fadeRightVariants.visible,
                    transition: {
                        duration: duration ?? 0.7,
                        delay,
                        ease: easeOutExpo,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ScaleIn - Scales up from smaller size
export function ScaleIn({
    children,
    delay = 0,
    duration,
    className = "",
    once = true,
    amount = 0.2,
    ...props
}: ScrollAnimationProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={{
                hidden: scaleInVariants.hidden,
                visible: {
                    ...scaleInVariants.visible,
                    transition: {
                        duration: duration ?? 0.7,
                        delay,
                        ease: easeOutExpo,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// StaggerContainer - Container that staggers children animations
interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "initial" | "whileInView" | "viewport" | "variants"> {
    children: ReactNode
    staggerDelay?: number
    delayChildren?: number
    className?: string
    once?: boolean
    amount?: number | "some" | "all"
}

export function StaggerContainer({
    children,
    staggerDelay = 0.1,
    delayChildren = 0,
    className = "",
    once = true,
    amount = 0.2,
    ...props
}: StaggerContainerProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// StaggerItem - Child item for StaggerContainer
interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "variants"> {
    children: ReactNode
    className?: string
    type?: "fadeUp" | "fadeLeft" | "fadeRight" | "scaleIn"
}

export function StaggerItem({
    children,
    className = "",
    type = "fadeUp",
    ...props
}: StaggerItemProps) {
    const variants = {
        fadeUp: fadeUpVariants,
        fadeLeft: fadeLeftVariants,
        fadeRight: fadeRightVariants,
        scaleIn: scaleInVariants,
    }

    return (
        <motion.div
            variants={variants[type]}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}
