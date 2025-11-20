"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

// A lightweight top progress bar that starts when navigation intent occurs
// and completes when the pathname updates. It advances gradually to suggest progress.
export function TopLoader() {
	const pathname = usePathname()
	const [isVisible, setIsVisible] = useState(false)
	const [progress, setProgress] = useState(0)
	const rafRef = useRef<number | null>(null)
	const startedRef = useRef(false)
	const completeTimerRef = useRef<number | null>(null)
	const pathnameWhenStartedRef = useRef<string | null>(null)
	const safetyTimerRef = useRef<number | null>(null)
	const pathnameRef = useRef(pathname)

	// Incremental progress animation towards a ceiling (e.g., 85%) until completion
	const startIncrementing = () => {
		if (rafRef.current) cancelAnimationFrame(rafRef.current)
		let last = performance.now()
		const tick = (now: number) => {
			const delta = Math.min(100, now - last)
			last = now
			setProgress(prev => {
				if (prev >= 85) return prev
				// Easing-like incremental step; faster at the beginning, slower later
				const remaining = 85 - prev
				const step = Math.max(0.6, Math.min(remaining * 0.05, 4)) * (delta / 16)
				return Math.min(85, prev + step)
			})
			rafRef.current = requestAnimationFrame(tick)
		}
		rafRef.current = requestAnimationFrame(tick)
	}

	const stopIncrementing = () => {
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current)
			rafRef.current = null
		}
	}

	const begin = () => {
		if (startedRef.current) return
		startedRef.current = true
		pathnameWhenStartedRef.current = pathname
		setIsVisible(true)
		setProgress(10)
		startIncrementing()
		
		// Safety timer: if pathname doesn't change within 500ms, complete the loader
		if (safetyTimerRef.current) window.clearTimeout(safetyTimerRef.current)
		safetyTimerRef.current = window.setTimeout(() => {
			if (pathnameWhenStartedRef.current === pathnameRef.current) {
				complete()
			}
		}, 500)
	}

	const complete = () => {
		stopIncrementing()
		if (safetyTimerRef.current) {
			window.clearTimeout(safetyTimerRef.current)
			safetyTimerRef.current = null
		}
		setProgress(100)
		if (completeTimerRef.current) window.clearTimeout(completeTimerRef.current)
		completeTimerRef.current = window.setTimeout(() => {
			setIsVisible(false)
			setProgress(0)
			startedRef.current = false
			pathnameWhenStartedRef.current = null
		}, 250)
	}

	// Heuristics to detect navigation intent in the App Router world
	useEffect(() => {
		// 1) Link clicks (capture early)
		const onClick = (e: MouseEvent) => {
			// Only primary button with no modifier keys
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
			let el = e.target as HTMLElement | null
			while (el && el !== document.body) {
				if (el.tagName === "A") {
					const anchor = el as HTMLAnchorElement
					const href = anchor.getAttribute("href")
					if (href && href.startsWith("/")) {
						// Normalize href by removing query params and hash for comparison
						const normalizedHref = href.split("?")[0].split("#")[0]
						const normalizedPathname = pathnameRef.current.split("?")[0].split("#")[0]
						
						// If clicking on link to the same page, ensure loader completes if running
						if (normalizedHref === normalizedPathname) {
							// If loader is already running, complete it immediately
							if (startedRef.current) {
								complete()
							}
							// Don't start a new loader for same-page navigation
							return
						}
						
						begin()
					}
					break
				}
				el = el.parentElement
			}
		}

		// 2) History navigations (back/forward)
		const onPopState = () => begin()

		// 3) Form submissions that cause client navigation
		const onSubmit = (e: Event) => {
			const form = e.target as HTMLFormElement
			if (form && (form.method?.toLowerCase?.() === "get" || form.hasAttribute("action"))) begin()
		}

		document.addEventListener("click", onClick, true)
		window.addEventListener("popstate", onPopState)
		document.addEventListener("submit", onSubmit, true)
		return () => {
			document.removeEventListener("click", onClick, true)
			window.removeEventListener("popstate", onPopState)
			document.removeEventListener("submit", onSubmit, true)
		}
	}, [])

	// Update pathname ref whenever it changes
	useEffect(() => {
		pathnameRef.current = pathname
	}, [pathname])
	
	// When pathname updates, we mark completion to allow page skeletons to continue
	useEffect(() => {
		if (startedRef.current) {
			// If pathname changed from when we started, complete normally
			if (pathnameWhenStartedRef.current !== pathname) {
				complete()
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])
	
	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (safetyTimerRef.current) {
				window.clearTimeout(safetyTimerRef.current)
			}
			if (completeTimerRef.current) {
				window.clearTimeout(completeTimerRef.current)
			}
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current)
			}
		}
	}, [])

	// Render bar
	return (
		<div
			aria-hidden
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				height: isVisible ? 3 : 0,
				width: `${progress}%`,
				background:
					"linear-gradient(90deg, rgba(124,58,237,1) 0%, rgba(236,72,153,1) 50%, rgba(59,130,246,1) 100%)",
				boxShadow: isVisible ? "0 0 8px rgba(99,102,241,0.6)" : "none",
				transition: "width 150ms ease, height 250ms ease, opacity 250ms ease",
				opacity: isVisible ? 1 : 0,
				zIndex: 9999,
			}}
		/>
	)
}


