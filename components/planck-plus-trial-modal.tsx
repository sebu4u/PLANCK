"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Rocket, Star, X } from "lucide-react"

const FALLBACK_AVATAR_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23e5e7eb' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3EAD%3C/text%3E%3C/svg%3E"

interface PlanckPlusTrialModalProps {
  title: string
  description?: string
  ctaHref?: string
  ctaLabel?: string
  dismissLabel?: string
  onClose: () => void
}

export function PlanckPlusTrialModal({
  title,
  description,
  ctaHref = "/pricing",
  ctaLabel = "Vreau sa incerc",
  dismissLabel = "Mai târziu",
  onClose,
}: PlanckPlusTrialModalProps) {
  const [avatarSrc, setAvatarSrc] = useState<string>("/alex-dinu.jpg")

  return (
    <div className="w-full max-w-sm sm:max-w-md rounded-[32px] border border-gray-200 bg-white p-6 text-center shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Închide"
      >
        <X className="w-5 h-5" />
      </button>

      {/* PLANCK Logo */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <Rocket className="w-6 h-6 text-gray-900" />
        <span className="text-xl font-bold text-gray-900 title-font">PLANCK</span>
      </div>

      {/* Main Text */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      {description ? (
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{description}</p>
      ) : null}

      {/* Review Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl text-left">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <Image
                src={avatarSrc}
                alt="Alex Dinu"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setAvatarSrc(FALLBACK_AVATAR_DATA_URI)}
              />
            </div>
            <div className="text-gray-900 font-medium text-sm">Alex Dinu</div>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed italic">
          "Am trecut de la nota 7 la 9,5 la fizică în 2 luni cu Planck Plus"
        </p>
      </div>

      {/* CTA Button */}
      <div className="space-y-2">
        <Link
          href={ctaHref}
          className="block w-full rounded-full bg-[#111827] px-6 py-4 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {ctaLabel}
        </Link>

        <button
          onClick={onClose}
          className="block w-full rounded-full px-6 py-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  )
}

