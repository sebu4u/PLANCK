"use client"

import { Suspense, lazy } from 'react'
import type { KnowledgeNode } from '@/lib/types/knowledge-graph'
import { getDifficultyColor } from '@/lib/supabase-knowledge-graph'
import { Lightbulb, AlertTriangle, BookOpen, Calculator, X } from 'lucide-react'
import 'katex/dist/katex.min.css'

// Lazy load KaTeX InlineMath component
const LazyInlineMath = lazy(() =>
    import('react-katex').then(module => ({ default: module.InlineMath }))
)

interface NodeInfoCardProps {
    node: KnowledgeNode | null
    recommendations: KnowledgeNode[]
    onClose: () => void
    onNodeSelect: (nodeId: string) => void
}

export function NodeInfoCard({ node, recommendations, onClose, onNodeSelect }: NodeInfoCardProps) {
    // Don't render anything if no node is selected
    if (!node) {
        return null
    }

    const difficultyLabels = {
        basic: 'Bază',
        intermediate: 'Intermediar',
        advanced: 'Avansat',
    }

    // Limit recommendations to 3
    const limitedRecommendations = recommendations.slice(0, 3)

    return (
        <div className="h-full flex flex-col p-4 gap-3 overflow-y-auto custom-scrollbar pb-40 md:pb-4">
            {/* Card 1: Title, Type, Difficulty + Explanation/Formula */}
            <div className="bg-[#1a1a1d]/90 md:bg-[#1a1a1d]/50 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg overflow-hidden relative">
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white md:hidden"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header with type and difficulty badges */}
                <div className="flex items-center gap-2 mb-2 pr-8 md:pr-0">
                    {node.type === 'concept' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                            <BookOpen className="w-3 h-3" />
                            Concept
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-500/20 text-pink-400">
                            <Calculator className="w-3 h-3" />
                            Formulă
                        </span>
                    )}
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: `${getDifficultyColor(node.difficulty)}20`,
                            color: getDifficultyColor(node.difficulty),
                        }}
                    >
                        {difficultyLabels[node.difficulty]}
                    </span>
                </div>

                {/* Node title */}
                <h2 className="text-lg font-bold text-white mb-3">{node.title}</h2>

                {/* Formula display (if formula type) */}
                {node.formula && (
                    <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-3 mb-3">
                        <span className="text-xl font-bold text-white block text-center">
                            <Suspense fallback={<span className="animate-pulse text-white/60">Loading...</span>}>
                                <LazyInlineMath math={node.formula} />
                            </Suspense>
                        </span>
                    </div>
                )}

                {/* Explanation */}
                <p className="text-white/80 text-sm leading-relaxed">
                    {node.explanation}
                </p>
            </div>

            {/* Card 2: Intuition (only if available) */}
            {node.intuition && (
                <div className="bg-[#1a1a1d]/50 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg overflow-hidden">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-amber-400 mb-1">Intuiție</h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {node.intuition}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Card 3: Common Mistake (only if available) */}
            {node.common_mistake && (
                <div className="bg-[#1a1a1d]/50 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg overflow-hidden">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-red-400 mb-1">Greșeală frecventă</h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {node.common_mistake}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Related nodes - small text, no card, max 3 */}
            {limitedRecommendations.length > 0 && (
                <div className="mt-1">
                    <span className="text-xs text-white/40">Noduri legate: </span>
                    {limitedRecommendations.map((rec, index) => (
                        <span key={rec.id}>
                            <button
                                onClick={() => onNodeSelect(rec.id)}
                                className="text-xs text-white/60 hover:text-white underline underline-offset-2 transition-colors"
                            >
                                {rec.title}
                            </button>
                            {index < limitedRecommendations.length - 1 && (
                                <span className="text-xs text-white/40">, </span>
                            )}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
