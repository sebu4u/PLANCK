"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Paperclip, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Orb from "@/components/orb"
import InsightActionButtons from "@/components/insight-action-buttons"
import InsightProblemsDialog from "@/components/insight-problems-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PREFILL_STORAGE_PREFIX = "insight-prefill-"

const generatePrefillToken = () => {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const persistPrefillPrompt = (token: string, prompt: string) => {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(`${PREFILL_STORAGE_PREFIX}${token}`, prompt)
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export default function InsightScrollHero() {
  const navbarBg = useMemo(() => '#0d1117', [])
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [plusPlanPopupOpen, setPlusPlanPopupOpen] = useState(false)
  const [plusPlanPopupType, setPlusPlanPopupType] = useState<'think' | 'teach' | null>(null)
  const [problemsDialogOpen, setProblemsDialogOpen] = useState(false)

  const handleChatClick = async () => {
    if (busy) return

    const chatUrl = '/insight/chat'

    if (!user) {
      // Redirect to unauthorized page which explains they need an account
      router.push(`/insight/unauthorized?redirect=${encodeURIComponent(chatUrl)}`)
      return
    }

    setBusy(true)

    try {
      router.push(chatUrl)
    } catch (e: any) {
      const errorMsg = e.message || 'Eroare la redirecționare.'
      toast({
        title: 'Eroare',
        description: errorMsg,
        variant: 'destructive',
      })
      router.push('/insight/chat')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      {/* Hero section with fixed height of one screen */}
      <div className="relative h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden">
        {/* Orb background only in hero section */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Orb hue={0} />
        </div>
        <div className="w-full max-w-5xl mx-auto text-center relative z-10">
            <h1 className="scroll-animate-fade-up text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-12 leading-tight">
              Learn with <span className="cosmic-text-glow">Insight</span>
            </h1>

            {/* Chatbar - matching chat page style */}
            <div className="w-full max-w-3xl mx-auto scroll-animate-fade-up animate-delay-200">
              <button
                onClick={handleChatClick}
                disabled={busy}
                className="relative w-full flex items-end gap-2 bg-[#212121] border border-gray-600 rounded-2xl p-2 sm:p-3 shadow-lg backdrop-blur-sm hover:shadow-xl hover:border-gray-500 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-1.5 sm:p-2 rounded flex-shrink-0 pointer-events-none">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 text-left text-white placeholder:text-gray-400 text-sm sm:text-base pointer-events-none min-h-[24px] flex items-center">
                  <span className="text-gray-400">What do you want to know?</span>
                </div>
                <div className="p-1.5 sm:p-2 rounded flex-shrink-0 pointer-events-none">
                  <Send className="w-4 h-4 text-gray-400" />
                </div>
              </button>
              <div className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 text-center px-2">
                Plan Free: limită 3 mesaje/zi. Apasă Enter pentru a trimite, Shift+Enter pentru
                linie nouă.
              </div>
              {/* Action Buttons */}
              <InsightActionButtons
                onThinkDeeper={() => {
                  if (!user) {
                    router.push('/insight/unauthorized?redirect=' + encodeURIComponent('/insight/chat'))
                    return
                  }
                  setPlusPlanPopupType('think')
                  setPlusPlanPopupOpen(true)
                }}
                onTeachMe={() => {
                  if (!user) {
                    router.push('/insight/unauthorized?redirect=' + encodeURIComponent('/insight/chat'))
                    return
                  }
                  setPlusPlanPopupType('teach')
                  setPlusPlanPopupOpen(true)
                }}
                onSolveProblem={() => {
                  if (!user) {
                    router.push('/insight/unauthorized?redirect=' + encodeURIComponent('/insight/chat'))
                    return
                  }
                  setProblemsDialogOpen(true)
                }}
              />
            </div>
        </div>
      </div>

      {/* Plus Plan Popup */}
      <AlertDialog open={plusPlanPopupOpen} onOpenChange={setPlusPlanPopupOpen}>
        <AlertDialogContent className="bg-black border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {plusPlanPopupType === 'think' ? 'Think Deeper' : 'Teach me'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Această funcționalitate necesită planul Plus sau superior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              Închide
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/insight')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Vezi planurile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Problems Dialog */}
      <InsightProblemsDialog
        open={problemsDialogOpen}
        onOpenChange={setProblemsDialogOpen}
        onSelectProblem={(problemText) => {
          const prefillToken = generatePrefillToken()
          persistPrefillPrompt(prefillToken, problemText)
          const params = new URLSearchParams({ prefill: problemText, prefillToken })
          const chatUrl = `/insight/chat?${params.toString()}`
          router.push(chatUrl)
        }}
      />
    </div>
  )
}
