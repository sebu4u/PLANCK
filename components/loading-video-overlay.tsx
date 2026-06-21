"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export const LOADING_VIDEO_SRC = "/videos/loading.webm"

export interface LoadingVideoProps {
  className?: string
  style?: React.CSSProperties
  animateEntry?: boolean
  maxWidth?: string
  maxHeight?: string
}

export const LoadingVideo = forwardRef<HTMLVideoElement, LoadingVideoProps>(function LoadingVideo(
  { className, style, animateEntry = false, maxWidth = "min(40vw, 140px)", maxHeight = "22vh" },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement)

  useEffect(() => {
    if (!videoRef.current) return
    const playPromise = videoRef.current.play()
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {})
    }
  }, [])

  return (
    <div className={animateEntry ? "loading-video-pop-in" : undefined}>
      <video
        ref={videoRef}
        src={LOADING_VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={cn("block object-contain", className)}
        style={{
          width: "auto",
          height: "auto",
          maxWidth,
          maxHeight,
          ...style,
        }}
      />
    </div>
  )
})

export const DEFAULT_LOADING_TIPS = [
  'Tips: Explorează secțiunea "Grile" pentru a-ți testa rapid cunoștințele!',
  "Tips: Poți salva proiectele tale pe PlanckCode pentru a reveni oricând la ele.",
  "Tips: Folosește AI Tutor pentru explicații pas cu pas la problemele dificile.",
]

interface LoadingVideoOverlayProps {
  zIndex?: number
  tipMessages?: string[]
  showTips?: boolean
  animateEntry?: boolean
}

export function LoadingVideoOverlay({
  zIndex = 500,
  tipMessages = DEFAULT_LOADING_TIPS,
  showTips = true,
  animateEntry = false,
}: LoadingVideoOverlayProps) {
  const [randomTip, setRandomTip] = useState<string | null>(null)

  useEffect(() => {
    if (!showTips || tipMessages.length === 0) {
      setRandomTip(null)
      return
    }

    setRandomTip(tipMessages[Math.floor(Math.random() * tipMessages.length)])
  }, [showTips, tipMessages])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <LoadingVideo animateEntry={animateEntry} />
      {randomTip && (
        <p
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: 640,
            padding: "0 16px",
            textAlign: "center",
            fontSize: 13,
            color: "#374151",
            margin: 0,
          }}
        >
          {randomTip}
        </p>
      )}
    </div>
  )
}
