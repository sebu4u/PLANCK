'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    ChevronDown,
    Calendar,
    FileText,
    X
} from 'lucide-react'
import { BacYearGroup, BacSubjectSummary } from '@/lib/supabase-bac'

interface BacSidebarProps {
    yearGroups: BacYearGroup[]
    currentSubjectId?: string
    onSubjectSelect: (subject: BacSubjectSummary) => void
    onClose?: () => void
}

export function BacSidebar({
    yearGroups,
    currentSubjectId,
    onSubjectSelect,
    onClose
}: BacSidebarProps) {
    const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

    // Auto-expand anul care conține subiectul curent
    useEffect(() => {
        if (!currentSubjectId || yearGroups.length === 0) return

        for (const group of yearGroups) {
            if (group.subjects.some(s => s.id === currentSubjectId)) {
                setExpandedYears(prev => {
                    const next = new Set(prev)
                    next.add(group.year)
                    return next
                })
                break
            }
        }
    }, [currentSubjectId, yearGroups])

    const toggleYear = (year: number) => {
        const newExpanded = new Set(expandedYears)
        if (newExpanded.has(year)) {
            newExpanded.delete(year)
        } else {
            newExpanded.add(year)
        }
        setExpandedYears(newExpanded)
    }

    return (
        <div className="lesson-sidebar-scroll w-full lg:w-80 h-full lg:h-[calc(100vh-4rem)] overflow-y-auto flex-shrink-0 lg:block">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Simulări BAC</h2>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden text-white hover:text-white/80 hover:bg-white/10 transition-all duration-200"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4 animate-in zoom-in duration-200" />
                        </Button>
                    )}
                </div>

                {yearGroups.length === 0 ? (
                    <div className="text-white/50 text-sm text-center py-8">
                        Nu există subiecte disponibile.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {yearGroups.map((group) => {
                            const isExpanded = expandedYears.has(group.year)
                            const hasSelectedSubject = group.subjects.some(s => s.id === currentSubjectId)

                            return (
                                <div key={group.year} className="mb-2">
                                    {/* Year Header */}
                                    <button
                                        className="w-full text-left p-2 h-auto transition-all duration-200 ease-in-out hover:opacity-80"
                                        onClick={() => toggleYear(group.year)}
                                    >
                                        <div className="flex items-center w-full">
                                            <ChevronDown
                                                className={`w-4 h-4 mr-2 transition-transform duration-500 ease-in-out ${hasSelectedSubject ? 'text-blue-400' : 'text-white'
                                                    } ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                                            />
                                            <Calendar className={`w-5 h-5 mr-3 ${hasSelectedSubject ? 'text-blue-400' : 'text-white'}`} />
                                            <div className="flex-1 text-left">
                                                <div className={`font-semibold ${hasSelectedSubject ? 'text-blue-400' : 'text-white'}`}>
                                                    Anul {group.year}
                                                </div>
                                            </div>
                                            <div className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full ml-auto whitespace-nowrap">
                                                {group.subjects.length} {group.subjects.length === 1 ? 'subiect' : 'subiecte'}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Subjects */}
                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}>
                                        <div className={`transition-all duration-500 ease-in-out ${isExpanded
                                                ? 'translate-y-0 opacity-100'
                                                : '-translate-y-4 opacity-0'
                                            }`}>
                                            {group.subjects.map((subject) => {
                                                const isCurrentSubject = currentSubjectId === subject.id

                                                return (
                                                    <button
                                                        key={subject.id}
                                                        className="w-full text-left p-2 h-auto transition-all duration-200 ease-in-out hover:opacity-80 pl-10"
                                                        onClick={() => onSubjectSelect(subject)}
                                                    >
                                                        <div className="flex items-center w-full group">
                                                            <FileText className={`w-4 h-4 mr-3 ${isCurrentSubject ? 'text-blue-400' : 'text-white/60'
                                                                }`} />
                                                            <div className={`font-medium text-sm break-words flex-1 ${isCurrentSubject ? 'text-blue-400' : 'text-white'
                                                                }`}>
                                                                {subject.name}
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
