"use client"

import Image from "next/image"
import Link from "next/link"
import { getRankIconPath } from "@/lib/rank-icon"

interface DashboardRankCardProps {
  rank: string
  elo: number
}

export function DashboardRankCard({ rank, elo }: DashboardRankCardProps) {
  const rankIconPath = getRankIconPath(rank)

  return (
    <section className="rounded-[2rem] border-2 border-[#e5e5e5] bg-white px-6 py-8 text-center shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
      <Image
        src={rankIconPath}
        alt={rank}
        width={112}
        height={112}
        className="mx-auto h-24 w-24 object-contain"
        priority={false}
      />

      <h3 className="mt-6 text-2xl font-extrabold leading-tight tracking-tight text-[#080808]">
        Esti in {rank}
      </h3>
      <p className="mx-auto mt-3 max-w-[260px] text-base leading-relaxed text-[#111111]">
        Ai {elo} ELO. Continua sa rezolvi probleme si sa urci in clasament.
      </p>

      <Link
        href="/probleme"
        className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-full border-2 border-[#e5e5e5] bg-white px-6 text-lg font-extrabold text-[#080808] transition-[border-color,background-color,transform] hover:border-[#d4d4d4] hover:bg-[#fafafa] active:translate-y-0.5"
      >
        Continua
      </Link>
    </section>
  )
}
