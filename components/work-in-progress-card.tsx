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
            <div
                className="relative overflow-hidden rounded-r-lg border-l-4 border-amber-500 py-2 px-4 shadow-lg backdrop-blur-sm"
                style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.25) 100%)',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                }}
            >
                <div className="flex items-start gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 text-amber-200/80 hover:text-white transition-colors duration-200 mt-0.5 p-0.5 hover:bg-white/10 rounded-full"
                        aria-label="Închide avertismentul"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex-1 text-white">
                        <h3 className="text-sm font-bold text-amber-100 mb-0.5 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Conținut în lucru
                        </h3>
                        <p className="text-xs lg:text-sm leading-snug text-white/90">
                            Momentan lucrăm intens la dezvoltarea acestor cursuri și conținutul nu este încă finalizat. Vă mulțumim pentru răbdare și înțelegere în timp ce pregătim materiale de cea mai bună calitate!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
