"use client"

import { useEffect, useRef, useState } from "react"

export const DEFAULT_LOADING_TIPS = [
  "Tips: Explorează secțiunea \"Grile\" pentru a-ți testa rapid cunoștințele!",
  "Tips: Poți salva proiectele tale pe PlanckCode pentru a reveni oricând la ele.",
  "Tips: Folosește AI Tutor pentru explicații pas cu pas la problemele dificile.",
]

interface LoadingVideoOverlayProps {
  zIndex?: number
  tipMessages?: string[]
  showTips?: boolean
}

export function LoadingVideoOverlay({
  zIndex = 500,
  tipMessages = DEFAULT_LOADING_TIPS,
  showTips = true,
}: LoadingVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [randomTip, setRandomTip] = useState<string | null>(null)

  useEffect(() => {
    if (!showTips || tipMessages.length === 0) {
      setRandomTip(null)
      return
    }

    setRandomTip(tipMessages[Math.floor(Math.random() * tipMessages.length)])
  }, [showTips, tipMessages])

  useEffect(() => {
    if (!videoRef.current) return
    const playPromise = videoRef.current.play()
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => { })
    }
  }, [])

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
      <video
        ref={videoRef}
        src="/videos/loading.webm"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          display: "block",
          width: "auto",
          height: "auto",
          maxWidth: "min(40vw, 140px)",
          maxHeight: "22vh",
          objectFit: "contain",
        }}
      />
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
