'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

export function WorkInProgressCard() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if the user has already closed the warning
        const hasSeenWarning = localStorage.getItem('physics-wip-warning-closed')
        if (!hasSeenWarning) {
            setIsVisible(true)
        }
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        localStorage.setItem('physics-wip-warning-closed', 'true')
    }

    if (!isVisible) return null

    return (
        <div className="mx-4 lg:mx-6 mt-4 lg:mt-6 mb-0">
            <div className="relative overflow-hidden rounded-r-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 py-2 px-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 text-amber-700/70 hover:text-amber-900 transition-colors duration-200 mt-0.5 p-0.5 hover:bg-amber-100 rounded-full"
                        aria-label="Închide avertismentul"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex-1 text-amber-950">
                        <h3 className="text-sm font-bold text-amber-900 mb-0.5 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Conținut în lucru
                        </h3>
                        <p className="text-xs lg:text-sm leading-snug text-amber-900/80">
                            Momentan lucrăm intens la dezvoltarea acestor cursuri și conținutul nu este încă finalizat. Vă mulțumim pentru răbdare și înțelegere în timp ce pregătim materiale de cea mai bună calitate!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
