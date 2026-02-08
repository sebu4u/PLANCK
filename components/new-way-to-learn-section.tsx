"use client"

import { useState, useMemo, useCallback } from 'react'
import { KnowledgeGraph } from '@/components/space/knowledge-graph'
import type { KnowledgeNode, ForceGraphData } from '@/lib/types/knowledge-graph'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Calculator, X } from 'lucide-react'
import 'katex/dist/katex.min.css'
import dynamic from 'next/dynamic'

// Lazy load KaTeX InlineMath component
const LazyInlineMath = dynamic(() =>
    import('react-katex').then(module => ({ default: module.InlineMath })),
    { ssr: false }
)

// Static data for the homepage graph (4 nodes)
const HOMEPAGE_NODES: KnowledgeNode[] = [
    {
        id: '1',
        title: 'Viteză',
        type: 'concept',
        explanation: 'Măsura rapidității cu care un obiect își schimbă poziția în timp.',
        difficulty: 'basic',
        relatedNodeIds: ['2', '3']
    },
    {
        id: '2',
        title: 'Accelerație',
        type: 'concept',
        explanation: 'Rata de schimbare a vitezei în timp. Poate fi pozitivă (accelerare) sau negativă (frânare).',
        difficulty: 'basic',
        relatedNodeIds: ['1', '3', '4']
    },
    {
        id: '3',
        title: 'Forță',
        type: 'concept',
        explanation: 'O interacțiune capabilă să schimbe starea de mișcare a unui corp (legea a 2-a a lui Newton).',
        difficulty: 'basic',
        relatedNodeIds: ['2', '4']
    },
    {
        id: '4',
        title: 'F = m · a',
        type: 'formula',
        explanation: 'Legea fundamentală a dinamicii: forța este produsul dintre masă și accelerație.',
        formula: 'F = m \\cdot a',
        difficulty: 'intermediate',
        relatedNodeIds: ['2', '3']
    }
]

const HOMEPAGE_LINKS = [
    { source: '1', target: '2' }, // Viteza <-> Acceleratie
    { source: '2', target: '3' }, // Acceleratie <-> Forta
    { source: '2', target: '4' }, // Acceleratie <-> F=ma
    { source: '3', target: '4' }, // Forta <-> F=ma
]

export function NewWayToLearnSection() {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const lockedNodeIds = useMemo(() => new Set<string>(), [])

    // Memoize graph data
    const forceGraphData: ForceGraphData = useMemo(() => ({
        nodes: HOMEPAGE_NODES.map(node => ({
            ...node,
            // Optional: pre-set generic positions if needed, but force engine handles it
        })),
        links: HOMEPAGE_LINKS.map(link => ({
            ...link
        }))
    }), [])

    // Get selected node object
    const selectedNode = useMemo(() =>
        HOMEPAGE_NODES.find(n => n.id === selectedNodeId) || null,
        [selectedNodeId])

    // Get connected IDs for highlighting
    const connectedNodeIds = useMemo(() => {
        if (!selectedNode) return new Set<string>()
        return new Set([selectedNode.id, ...selectedNode.relatedNodeIds])
    }, [selectedNode])

    const handleNodeClick = useCallback((nodeId: string) => {
        setSelectedNodeId(nodeId)
    }, [])

    return (
        <section className="w-full py-24 bg-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Interactive Graph */}
                    <div className="relative h-[500px] w-full bg-[#0a0a0b] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 lg:order-1">
                        <KnowledgeGraph
                            data={forceGraphData}
                            selectedNodeId={selectedNodeId}
                            connectedNodeIds={connectedNodeIds}
                            lockedNodeIds={lockedNodeIds}
                            onNodeClick={handleNodeClick}
                        />

                        {/* Info Card Overlay */}
                        <AnimatePresence>
                            {selectedNode && (
                                <motion.div
                                    initial={{ y: "100%", opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: "100%", opacity: 0 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="absolute bottom-4 left-4 right-4 z-10"
                                >
                                    <div className="bg-[#1a1a1d]/90 backdrop-blur-md border border-white/20 rounded-xl p-5 shadow-2xl text-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                {selectedNode.type === 'concept' ? (
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
                                            </div>
                                            <button
                                                onClick={() => setSelectedNodeId(null)}
                                                className="text-white/50 hover:text-white transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <h3 className="text-lg font-bold mb-2">{selectedNode.title}</h3>

                                        {selectedNode.formula && (
                                            <div className="bg-white/5 rounded-lg p-2 mb-2 text-center">
                                                <LazyInlineMath math={selectedNode.formula} />
                                            </div>
                                        )}

                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            {selectedNode.explanation}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Hint Text if nothing selected */}
                        {!selectedNode && (
                            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                                <p className="text-white/40 text-sm bg-black/50 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                                    Apasă pe noduri pentru a explora
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Text Content */}
                    <div className="lg:order-2">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                            Un nou mod de a învăța
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Explorează conexiunile dintre concepte într-un mod vizual și intuitiv.
                            Space te ajută să înțelegi fizica prin legături logice, nu prin memorare mecanică.
                            Navighează prin graficul de cunoștințe și descoperă cum se leagă formulele de teorie.
                        </p>

                        <Link href="/space" className="group relative inline-flex">
                            <span className="absolute -inset-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300 blur-md bg-gradient-to-r from-purple-400/60 to-blue-400/60 -z-20 pointer-events-none"></span>
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-100 transition-opacity duration-300 -z-10 pointer-events-none"></span>

                            <Button
                                size="lg"
                                className="bg-black hover:bg-gray-900 text-white border-0 transition-all duration-300 flex items-center gap-2 rounded-full px-8 py-6 h-auto text-lg relative z-10 m-[1px]"
                            >
                                Explorează Space
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    )
}
