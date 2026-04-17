"use client"

import Image from "next/image"

const iconPath = (n: number) => `/images/icons/Untitled%20design%20(${n}).png`

const DESKTOP_ITEMS = [
  { label: "Lecții structurate", src: iconPath(42) },
  { label: "Probleme gradate", src: iconPath(43) },
  { label: "AI Insight", src: iconPath(44) },
  { label: "Classroom", src: iconPath(45) },
  { label: "Progress tracking", src: iconPath(46) },
] as const

const MOBILE_ITEMS = [
  { label: "Lecții", src: iconPath(42) },
  { label: "Probleme", src: iconPath(43) },
  { label: "Progres", src: iconPath(46) },
] as const

function FeatureItem({ label, iconSrc }: { label: string; iconSrc: string }) {
  return (
    <li className="flex min-w-0 items-center justify-center gap-2.5 sm:gap-3">
      <Image
        src={iconSrc}
        alt=""
        width={48}
        height={48}
        className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10 lg:h-11 lg:w-11"
        aria-hidden
      />
      <span className="text-center text-sm font-semibold leading-snug text-gray-900 sm:text-base lg:text-[1.05rem]">
        {label}
      </span>
    </li>
  )
}

export function HeroFeatureBar() {
  return (
    <div className="w-full shrink-0 border-t-2 border-gray-300 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 sm:pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="flex w-full items-center justify-evenly gap-3 sm:justify-center sm:gap-x-10 lg:hidden">
          {MOBILE_ITEMS.map((item) => (
            <FeatureItem key={item.label} label={item.label} iconSrc={item.src} />
          ))}
        </ul>
        <ul className="hidden flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:flex xl:gap-x-12">
          {DESKTOP_ITEMS.map((item) => (
            <FeatureItem key={item.label} label={item.label} iconSrc={item.src} />
          ))}
        </ul>
      </div>
    </div>
  )
}
