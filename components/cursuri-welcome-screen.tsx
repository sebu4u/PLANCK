'use client'

import Link from 'next/link'
import { CSSProperties } from 'react'
import { ArrowLeft, BookOpen, CheckCircle2, MousePointerClick, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CursuriWelcomeScreenProps {
  onStart: () => void
}

const sections = [
  {
    title: 'Invata cu AI',
    desktopText: 'Incepi gratuit cu AI, parcurgi toata materia de liceu si iti cresti rapid notele la fiecare capitol important.',
    mobileText: 'Invata gratuit cu AI toata materia si ia note mai mari.',
    Icon: BookOpen,
  },
  {
    title: 'Vezi progresul clar',
    desktopText: 'Iti urmaresti progresul usor, vezi evolutia reala si marchezi fiecare lectie terminata pentru un ritm constant.',
    mobileText: 'Masori progresul si marchezi lectiile terminate, simplu si clar mereu.',
    Icon: CheckCircle2,
  },
  {
    title: 'Un click, rezultate',
    desktopText: 'Cu un singur click intri in lectii, inveti eficient si incepi sa obtii note mai mari mult mai repede.',
    mobileText: 'Un click te duce la lectii si la note mai mari.',
    Icon: MousePointerClick,
  },
]

const buttonParticles = [
  { x: -88, y: -28, delay: '0ms' },
  { x: -74, y: 12, delay: '70ms' },
  { x: -56, y: -42, delay: '120ms' },
  { x: -22, y: -50, delay: '170ms' },
  { x: 8, y: -56, delay: '230ms' },
  { x: 38, y: -44, delay: '280ms' },
  { x: 64, y: -20, delay: '340ms' },
  { x: 78, y: 8, delay: '390ms' },
  { x: 52, y: 34, delay: '440ms' },
  { x: 16, y: 46, delay: '500ms' },
  { x: -18, y: 42, delay: '560ms' },
  { x: -54, y: 30, delay: '620ms' },
]

export function CursuriWelcomeScreen({ onStart }: CursuriWelcomeScreenProps) {
  return (
    <div className="h-screen overflow-hidden bg-white text-black">
      <header className="h-16 border-b border-black/10">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            className="inline-flex flex-shrink-0 items-center gap-2 text-2xl font-bold text-black title-font transition-colors hover:text-gray-700"
          >
            <Rocket className="w-6 h-6 text-black" />
            <span>PLANCK</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-black px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi acasa
          </Link>
        </div>
      </header>

      <main className="flex h-[calc(100vh-4rem)] items-center justify-center overflow-hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 md:px-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {sections.map((section, index) => {
              const Icon = section.Icon
              return (
                <section
                  key={section.title}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 0.2}s`, animationFillMode: 'both' }}
                >
                  <Icon className="mb-5 h-10 w-10 text-black md:h-12 md:w-12" aria-hidden="true" />
                  <h2 className="mb-3 text-2xl font-semibold tracking-tight">{section.title}</h2>
                  <p className="hidden text-base leading-relaxed text-black md:block">{section.desktopText}</p>
                  <p className="text-base leading-relaxed text-black md:hidden">{section.mobileText}</p>
                </section>
              )
            })}
          </div>

          <div
            className="mt-24 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 md:mt-28"
            style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
          >
            <div className="blackhole-button group relative inline-flex">
              {buttonParticles.map((particle, index) => (
                <span
                  key={`particle-${index}`}
                  className="blackhole-particle"
                  style={
                    {
                      '--particle-x': `${particle.x}px`,
                      '--particle-y': `${particle.y}px`,
                      '--particle-delay': particle.delay,
                    } as CSSProperties
                  }
                />
              ))}

              <Button
                onClick={onStart}
                className="relative z-10 h-12 rounded-full bg-black px-8 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:bg-black/90"
              >
                Incepe acum gratuit
              </Button>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .blackhole-particle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 4px;
          height: 4px;
          border-radius: 9999px;
          background: #000000;
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0.3);
        }

        .blackhole-button:hover .blackhole-particle {
          animation: blackholeBurst 0.9s ease-out infinite;
          animation-delay: var(--particle-delay);
        }

        @keyframes blackholeBurst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          12% {
            opacity: 0.95;
          }
          92% {
            opacity: 0;
            transform: translate(
                calc(-50% + var(--particle-x)),
                calc(-50% + var(--particle-y))
              )
              scale(0.95);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
        }
      `}</style>
    </div>
  )
}
