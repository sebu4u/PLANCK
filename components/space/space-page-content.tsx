"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { KnowledgeGraph } from '@/components/space/knowledge-graph'
import { NodeInfoCard } from '@/components/space/node-info-card'
import { NodeListSidebar } from '@/components/space/node-list-sidebar'
import {
    getKnowledgeGraph,
    toForceGraphData,
    getNodeRecommendations,
    getNodeById
} from '@/lib/supabase-knowledge-graph'
import type { KnowledgeNode, GraphData, ForceGraphData } from '@/lib/types/knowledge-graph'
import { Loader2, Network } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpaceWelcomeCard } from '@/components/space/space-welcome-card'
import { SpaceUpgradeCtaCard } from '@/components/space/space-upgrade-cta-card'
import { useSubscriptionPlan } from '@/hooks/use-subscription-plan'
import { isNodeAllowedForFreePlan } from '@/lib/space-allowed-nodes'

export function SpacePageContent() {
    const [graphData, setGraphData] = useState<GraphData | null>(null)
    const [forceGraphData, setForceGraphData] = useState<ForceGraphData | null>(null)
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showWelcome, setShowWelcome] = useState(true)
    const [showUpgradeCta, setShowUpgradeCta] = useState(false)
    const { isPaid } = useSubscriptionPlan()

    // Fetch graph data on mount
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const data = await getKnowledgeGraph()
                setGraphData(data)
                setForceGraphData(toForceGraphData(data))
            } catch (err) {
                console.error('Error loading knowledge graph:', err)
                setError('Nu s-a putut încărca graful. Încearcă din nou.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Get selected node
    const selectedNode = useMemo(() => {
        if (!selectedNodeId || !graphData) return null
        return getNodeById(graphData.nodes, selectedNodeId) || null
    }, [selectedNodeId, graphData])

    // Get connected node IDs for highlighting
    const connectedNodeIds = useMemo(() => {
        if (!selectedNode) return new Set<string>()
        return new Set([selectedNode.id, ...selectedNode.relatedNodeIds])
    }, [selectedNode])

    // Get recommendations for selected node
    const recommendations = useMemo(() => {
        if (!selectedNode || !graphData) return []
        return getNodeRecommendations(selectedNode, graphData.nodes)
    }, [selectedNode, graphData])

    const lockedNodeIds = useMemo(() => {
        if (!graphData || isPaid) {
            return new Set<string>()
        }

        const locked = new Set<string>()
        graphData.nodes.forEach((node) => {
            if (!isNodeAllowedForFreePlan(node)) {
                locked.add(node.id)
            }
        })
        return locked
    }, [graphData, isPaid])

    // Handle node selection
    const handleNodeClick = useCallback((nodeId: string) => {
        if (lockedNodeIds.has(nodeId)) {
            setSelectedNodeId(null)
            setShowUpgradeCta(true)
            if (window.innerWidth < 768) {
                setSidebarOpen(false)
            }
            return
        }

        setShowUpgradeCta(false)
        setSelectedNodeId(nodeId)
        // On mobile, close sidebar if open
        if (window.innerWidth < 768) {
            setSidebarOpen(false)
        }
    }, [lockedNodeIds])

    // Handle close info card
    const handleCloseCard = useCallback(() => {
        setSelectedNodeId(null)
    }, [])

    // Toggle sidebar
    const handleToggleSidebar = useCallback(() => {
        setSidebarOpen(prev => {
            const newState = !prev
            // On mobile, if opening sidebar, close info card
            if (newState && window.innerWidth < 768) {
                setSelectedNodeId(null)
            }
            return newState
        })
    }, [])

    useEffect(() => {
        if (isPaid) {
            setShowUpgradeCta(false)
        }
    }, [isPaid])

    // Loading state
    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Se încarcă graful de cunoștințe...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !forceGraphData) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Network className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Eroare la încărcare</h2>
                    <p className="text-white/60 mb-4">{error || 'Nu există date în graf.'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Reîncearcă
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="pt-16 h-[calc(100vh-0px)] overflow-hidden relative">
            {/* Graph area - always full screen */}
            <div className="h-[calc(100vh-4rem)] w-full">
                <KnowledgeGraph
                    data={forceGraphData}
                    selectedNodeId={selectedNodeId}
                    connectedNodeIds={connectedNodeIds}
                    lockedNodeIds={lockedNodeIds}
                    onNodeClick={handleNodeClick}
                />
            </div>

            {/* Left sidebar - toggleable node list */}
            <NodeListSidebar
                nodes={graphData?.nodes || []}
                selectedNodeId={selectedNodeId}
                isOpen={sidebarOpen}
                onToggle={handleToggleSidebar}
                onNodeSelect={handleNodeClick}
                lockedNodeIds={lockedNodeIds}
            />

            {/* Floating cards overlay - appears on top of graph when node selected */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 w-full md:top-20 md:left-auto md:right-4 md:w-[340px] md:bottom-auto z-30 pointer-events-auto"
                    >
                        <div className="bg-gradient-to-t from-black via-black/90 to-transparent md:bg-none p-4 md:p-0">
                            <div className="max-h-[75dvh] md:max-h-[80vh] overflow-y-auto md:overflow-hidden rounded-2xl md:rounded-xl">
                                <NodeInfoCard
                                    node={selectedNode}
                                    recommendations={recommendations}
                                    onClose={handleCloseCard}
                                    onNodeSelect={handleNodeClick}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upgrade CTA Overlay */}
            <AnimatePresence>
                {showUpgradeCta && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <SpaceUpgradeCtaCard onClose={() => setShowUpgradeCta(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Welcome Card Overlay */}
            <AnimatePresence>
                {showWelcome && (
                    <SpaceWelcomeCard onClose={() => setShowWelcome(false)} />
                )}
            </AnimatePresence>
        </div>
    )
}

