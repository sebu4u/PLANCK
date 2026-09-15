"use client"

import { classroomJoinUrl } from "@/lib/classrooms/constants"

interface JoinCodeQrProps {
  joinCode: string
  size?: number
}

export function JoinCodeQr({ joinCode, size = 220 }: JoinCodeQrProps) {
  const origin = typeof window === "undefined" ? "" : window.location.origin
  const data = classroomJoinUrl(joinCode, origin || undefined)
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=M&data=${encodeURIComponent(data)}`

  return (
    <div className="inline-flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Cod QR pentru clasa ${joinCode}`} width={size} height={size} className="rounded-lg bg-white p-2" />
      <p className="font-mono text-lg font-semibold tracking-[0.2em] text-[#111827]">{joinCode}</p>
    </div>
  )
}
