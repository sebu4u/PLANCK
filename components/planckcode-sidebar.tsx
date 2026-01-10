'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code, FileText, FolderOpen, Settings } from 'lucide-react'
import { usePlanckCodeSettings } from './planckcode-settings-provider'

export function PlanckCodeSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const { openModal } = usePlanckCodeSettings()
  const pathname = usePathname()

  const menuItems = [
    { label: 'IDE', icon: Code, href: '/planckcode/ide' },
    { label: 'Proiecte', icon: FolderOpen, href: '/planckcode/projects' },
    { label: 'Probleme', icon: FileText, href: '/informatica/probleme', disabled: true },
  ]

  const baseButtonClassName = `w-full flex items-center py-3 text-white hover:bg-[#262626] transition-colors duration-200 relative font-vt323 text-lg ${isHovered ? 'justify-start px-4' : 'justify-center'
    }`

  return (
    <aside
      className={`hidden md:block fixed left-0 top-[64px] lg:top-[100px] z-[299] bg-[#181818] border-r border-[#3b3b3b] transition-all duration-300 ease-in-out h-[calc(100vh-64px)] lg:h-[calc(100vh-100px)] ${isHovered ? 'w-[200px]' : 'w-16'
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo Container */}
        <Link
          href="/planckcode"
          className="flex items-center justify-center p-4 border-b border-[#3b3b3b] min-h-[64px]"
        >
          <Image
            src="/codeicon.svg"
            alt="PlanckCode"
            width={32}
            height={32}
            className="w-8 h-8 object-contain transition-transform duration-200"
            priority
          />
          <span
            className={`text-sm font-semibold text-white transition-all duration-300 ${isHovered
              ? 'ml-3 opacity-100 translate-x-0'
              : 'ml-0 opacity-0 -translate-x-2 w-0 overflow-hidden'
              }`}
          >
            PlanckCode
          </span>
        </Link>

        {/* Navigation Buttons */}
        <nav className="flex-1 py-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isLink = item.href !== '#' && !item.disabled
              const isDisabled = item.disabled
              const isActive = pathname === item.href
              const className = `${baseButtonClassName} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${isActive ? 'bg-[#262626] border-l-2 border-white' : ''}`

              return (
                <li key={item.label}>
                  {isLink ? (
                    <Link href={item.href} className={className}>
                      {/* Icon - always fixed position */}
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {/* Text with animation */}
                      <span
                        className={`font-medium whitespace-nowrap mt-0.5 transition-all duration-300 ${isHovered
                          ? 'ml-3 opacity-100 translate-x-0'
                          : 'ml-0 opacity-0 -translate-x-2 w-0 overflow-hidden'
                          }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    <button className={className} disabled={isDisabled}>
                      {/* Icon - always fixed position */}
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {/* Text with animation */}
                      <span
                        className={`font-medium whitespace-nowrap mt-0.5 transition-all duration-300 ${isHovered
                          ? 'ml-3 opacity-100 translate-x-0'
                          : 'ml-0 opacity-0 -translate-x-2 w-0 overflow-hidden'
                          }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Settings Button */}
        <div className="mt-auto mb-4">
          <button
            onClick={openModal}
            className={baseButtonClassName}
            type="button"
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <span
              className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isHovered ? 'ml-3 opacity-100 translate-x-0' : 'ml-0 opacity-0 -translate-x-2 w-0 overflow-hidden'
                }`}
            >
              Setări IDE
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}

