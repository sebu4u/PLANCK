'use client'

import { useId, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/** Brand gradient used on Upgrade / lock (matches Free Tutor limit mock). */
export const CHAT_MESSAGE_LIMIT_GRADIENT =
  'linear-gradient(135deg, #8f91f1 0%, #cd83db 48%, #f2b93d 100%)'

export const CHAT_MESSAGE_LIMIT_PLACEHOLDER = 'Limită de mesaje atinsă'

type GradientLockIconProps = {
  className?: string
  size?: number
}

/** Solid padlock filled with the Free Tutor upgrade gradient. */
export function GradientLockIcon({ className, size = 16 }: GradientLockIconProps) {
  const gradientId = useId().replace(/:/g, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8f91f1" />
          <stop offset="0.5" stopColor="#cd83db" />
          <stop offset="1" stopColor="#f2b93d" />
        </linearGradient>
      </defs>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4" y="11" width="16" height="10" rx="2.5" fill={`url(#${gradientId})`} />
      <circle cx="12" cy="16" r="1.35" fill="white" fillOpacity="0.92" />
    </svg>
  )
}

type ChatMessageLimitLockButtonProps = {
  onClick?: () => void
  className?: string
  iconSize?: number
  tone?: 'light' | 'dark'
  'aria-label'?: string
  title?: string
}

/** Same footprint as a send button: gray circular chip + gradient lock. */
export function ChatMessageLimitLockButton({
  onClick,
  className,
  iconSize = 16,
  tone = 'light',
  'aria-label': ariaLabel = 'Limită de mesaje atinsă — Upgrade',
  title = 'Fă upgrade pentru mesaje nelimitate',
}: ChatMessageLimitLockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full text-transparent transition-opacity hover:opacity-90',
        tone === 'dark' ? 'bg-[#3a3a3a]' : 'bg-[#e5e5e5]',
        className,
      )}
    >
      <GradientLockIcon size={iconSize} />
    </button>
  )
}

type ChatMessageLimitHintProps = {
  onUpgradeClick: () => void
  className?: string
  /** Light composer (default) vs dark Insight surfaces */
  tone?: 'light' | 'dark'
}

export function ChatMessageLimitHint({
  onUpgradeClick,
  className,
  tone = 'light',
}: ChatMessageLimitHintProps) {
  const upgradeStyle = {
    backgroundImage: CHAT_MESSAGE_LIMIT_GRADIENT,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  } as CSSProperties

  return (
    <p
      className={cn(
        'px-1 text-center text-[13px] leading-5',
        tone === 'dark' ? 'text-[#a3a3a3]' : 'text-[#6b7280]',
        className,
      )}
    >
      Limită Free Tutor atinsă ·{' '}
      <button
        type="button"
        onClick={onUpgradeClick}
        className="font-semibold transition-opacity hover:opacity-80"
        style={upgradeStyle}
      >
        Upgrade
      </button>
    </p>
  )
}
