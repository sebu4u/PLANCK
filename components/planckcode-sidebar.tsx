'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code, FileText, FolderOpen, Settings } from 'lucide-react'
import { usePlanckCodeSettings } from './planckcode-settings-provider'

export function PlanckCodeSidebar() {
  const { openModal } = usePlanckCodeSettings()
  const pathname = usePathname()
  const isPlanckCode = pathname?.startsWith('/planckcode') ?? false
  const topOffset = isPlanckCode ? 'top-16' : 'top-[100px]'
  const heightCalc = isPlanckCode ? 'h-[calc(100vh-64px)]' : 'h-[calc(100vh-100px)]'

  const menuItems = [
    { label: 'IDE', icon: Code, href: '/planckcode/ide' },
    { label: 'Proiecte', icon: FolderOpen, href: '/planckcode/projects' },
    { label: 'Probleme', icon: FileText, href: '/informatica/probleme', disabled: true },
  ]

  const baseButtonClassName = 'w-full flex items-center justify-center py-3 text-white hover:bg-[#262626] transition-colors duration-200 relative font-vt323 text-lg'

  return (
    <aside
      className={`hidden md:block fixed left-0 z-[299] w-16 bg-[#181818] border-r border-[#3b3b3b] ${topOffset} ${heightCalc}`}
    >
      <div className="flex flex-col h-full">
        {/* Logo Container */}
        <Link
          href="/planckcode"
          className="flex items-center justify-center p-4 border-b border-[#3b3b3b] min-h-[64px]"
          title="PlanckCode"
        >
          <Image
            src="/codeicon.svg"
            alt="PlanckCode"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority
          />
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
                    <Link href={item.href} className={className} title={item.label}>
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </Link>
                  ) : (
                    <button className={className} disabled={isDisabled} title={item.label}>
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
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
            title="Setări IDE"
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}

