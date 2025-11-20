import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PlanckCodeContentWrapperProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
  flush?: boolean
}

export function PlanckCodeContentWrapper({
  children,
  className,
  innerClassName,
  flush = false,
}: PlanckCodeContentWrapperProps) {
  return (
    <div
      className={cn(
        'relative md:ml-16',
        flush ? null : 'px-6 sm:px-8 lg:px-12',
        className,
      )}
    >
      <div className={cn('mx-auto w-full max-w-6xl', innerClassName)}>{children}</div>
    </div>
  )
}


