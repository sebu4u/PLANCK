"use client"

import type { KnowledgeNode } from '@/lib/types/knowledge-graph'
import { ChevronRight, BookOpen, Calculator, X } from 'lucide-react'

interface NodeListSidebarProps {
    nodes: KnowledgeNode[]
    selectedNodeId: string | null
    isOpen: boolean
    onToggle: () => void
    onNodeSelect: (nodeId: string) => void
}

export function NodeListSidebar({
    nodes,
    selectedNodeId,
    isOpen,
    onToggle,
    onNodeSelect
}: NodeListSidebarProps) {
    // Group nodes by type
    const concepts = nodes.filter(n => n.type === 'concept')
    const formulas = nodes.filter(n => n.type === 'formula')

    return (
        <>
            {/* Toggle button - visible only when closed */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="absolute top-20 left-4 z-20 w-10 h-10 bg-[#1a1a1d]/80 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-[#1a1a1d] transition-colors"
                    aria-label="Deschide lista"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}

            {/* Sidebar panel - floating card */}
            <div
                className={`absolute top-20 left-4 h-[calc(100vh-6rem)] w-[280px] bg-[#1a1a1d]/50 backdrop-blur-md border border-white/10 rounded-xl shadow-lg transition-all duration-300 ease-out z-10 overflow-hidden ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-start">
                        <div>
                            <h2 className="text-sm font-semibold text-white/80">Toate nodurile</h2>
                            <p className="text-xs text-white/40 mt-1">{nodes.length} noduri în total</p>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Închide lista"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Node list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                        {/* Concepts section */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                                    Concepte ({concepts.length})
                                </span>
                            </div>
                            <div className="space-y-1">
                                {concepts.map(node => (
                                    <button
                                        key={node.id}
                                        onClick={() => onNodeSelect(node.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedNodeId === node.id
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {node.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Formulas section */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <Calculator className="w-4 h-4 text-pink-400" />
                                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                                    Formule ({formulas.length})
                                </span>
                            </div>
                            <div className="space-y-1">
                                {formulas.map(node => (
                                    <button
                                        key={node.id}
                                        onClick={() => onNodeSelect(node.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedNodeId === node.id
                                            ? 'bg-pink-500/20 text-pink-400'
                                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {node.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
