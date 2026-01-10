"use client"

import { useRef, useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { KnowledgeNode, ForceGraphData, GraphNode } from '@/lib/types/knowledge-graph'
import { getNodeColor } from '@/lib/supabase-knowledge-graph'

// Dynamic import for react-force-graph-2d (requires window)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#0a0a0b]">
            <div className="text-white/50 text-sm">Se încarcă graful...</div>
        </div>
    ),
})

interface KnowledgeGraphProps {
    data: ForceGraphData
    selectedNodeId: string | null
    connectedNodeIds: Set<string>
    onNodeClick: (nodeId: string) => void
}

export function KnowledgeGraph({
    data,
    selectedNodeId,
    connectedNodeIds,
    onNodeClick
}: KnowledgeGraphProps) {
    const graphRef = useRef<any>(null)
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const containerRef = useRef<HTMLDivElement>(null)

    // Resize handler
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setDimensions({ width: rect.width, height: rect.height })
            }
        }

        updateDimensions()
        window.addEventListener('resize', updateDimensions)
        return () => window.removeEventListener('resize', updateDimensions)
    }, [])

    // Track if we have centered the graph
    const hasCenteredRef = useRef(false)

    // Reset centering flag when data changes
    useEffect(() => {
        hasCenteredRef.current = false
    }, [data])

    // Handle engine stop - this ensures nodes have coordinates
    const handleEngineStop = useCallback(() => {
        if (!hasCenteredRef.current && graphRef.current) {
            const distanceNode = data.nodes.find(n =>
                n.title.toLowerCase() === 'distanță' ||
                n.title.toLowerCase() === 'distanta'
            )

            if (distanceNode && distanceNode.x !== undefined && distanceNode.y !== undefined) {
                // Center and zoom on "Distanță" node
                graphRef.current.centerAt(distanceNode.x, distanceNode.y, 1000)
                graphRef.current.zoom(6, 1000)
            } else {
                // Fallback to fitting all nodes
                graphRef.current.zoomToFit(400, 50)
            }

            hasCenteredRef.current = true
        }
    }, [data])

    // Handle node click
    const handleNodeClick = useCallback((node: any) => {
        if (node?.id) {
            onNodeClick(node.id as string)

            // Center on clicked node
            if (graphRef.current) {
                graphRef.current.centerAt(node.x, node.y, 300)
                graphRef.current.zoom(2, 300)
            }
        }
    }, [onNodeClick])

    // Custom node rendering
    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const graphNode = node as GraphNode
        const isSelected = selectedNodeId === graphNode.id
        const isHighlighted = connectedNodeIds.has(graphNode.id)
        const isActive = isSelected || isHighlighted

        const nodeX = node.x ?? 0
        const nodeY = node.y ?? 0

        // Node radius - smaller base size
        const baseRadius = 5
        const radius = isSelected ? baseRadius * 1.4 : (isHighlighted ? baseRadius * 1.2 : baseRadius)

        // Draw node glow for selected/highlighted
        if (isActive) {
            const gradient = ctx.createRadialGradient(nodeX, nodeY, 0, nodeX, nodeY, radius * 2.5)
            const glowColor = graphNode.type === 'concept' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)'
            gradient.addColorStop(0, glowColor)
            gradient.addColorStop(1, 'transparent')
            ctx.beginPath()
            ctx.arc(nodeX, nodeY, radius * 2.5, 0, 2 * Math.PI)
            ctx.fillStyle = gradient
            ctx.fill()
        }

        // Draw main node circle - solid color, no border
        ctx.beginPath()
        ctx.arc(nodeX, nodeY, radius, 0, 2 * Math.PI)
        ctx.fillStyle = getNodeColor(graphNode.type, isSelected, isHighlighted)
        ctx.fill()

        // Draw label
        const label = graphNode.title
        const fontSize = Math.max(10 / globalScale, 3)
        ctx.font = `${isActive ? 'bold ' : ''}${fontSize}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        // Label background
        const textWidth = ctx.measureText(label).width
        const labelY = nodeY + radius + 3

        if (isActive) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
            const padding = 2
            ctx.fillRect(
                nodeX - textWidth / 2 - padding,
                labelY - padding,
                textWidth + padding * 2,
                fontSize + padding * 2
            )
        }

        // Label text
        ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
        ctx.fillText(label, nodeX, labelY)

        // Draw type indicator (small icon/badge)
        if (graphNode.type === 'formula' && isActive) {
            const badgeSize = fontSize * 0.6
            ctx.font = `${badgeSize}px Inter, system-ui, sans-serif`
            ctx.fillStyle = '#f472b6'
            ctx.fillText('∑', nodeX + textWidth / 2 + 4, labelY)
        }
    }, [selectedNodeId, connectedNodeIds])

    // Custom link rendering
    const linkColor = useCallback((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source
        const targetId = typeof link.target === 'object' ? link.target.id : link.target

        const isConnectedToSelected =
            sourceId === selectedNodeId ||
            targetId === selectedNodeId

        return isConnectedToSelected
            ? 'rgba(255, 255, 255, 0.6)'
            : 'rgba(255, 255, 255, 0.3)'
    }, [selectedNodeId])

    const linkWidth = useCallback((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source
        const targetId = typeof link.target === 'object' ? link.target.id : link.target

        const isConnectedToSelected =
            sourceId === selectedNodeId ||
            targetId === selectedNodeId

        return isConnectedToSelected ? 2 : 0.5
    }, [selectedNodeId])

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-[#0a0a0b] rounded-lg overflow-hidden relative touch-none"
        >
            {/* Legend */}


            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                <button
                    onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 200)}
                    className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-colors flex items-center justify-center"
                    aria-label="Zoom in"
                >
                    +
                </button>
                <button
                    onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.3, 200)}
                    className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-colors flex items-center justify-center"
                    aria-label="Zoom out"
                >
                    −
                </button>
                <button
                    onClick={() => graphRef.current?.zoomToFit(400, 50)}
                    className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-colors flex items-center justify-center text-xs"
                    aria-label="Fit to view"
                >
                    ⊡
                </button>
            </div>

            <ForceGraph2D
                ref={graphRef}
                graphData={data}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="#0a0a0b"
                nodeCanvasObject={nodeCanvasObject}
                nodePointerAreaPaint={(node, color, ctx) => {
                    ctx.beginPath()
                    ctx.arc(node.x ?? 0, node.y ?? 0, 12, 0, 2 * Math.PI)
                    ctx.fillStyle = color
                    ctx.fill()
                }}
                linkColor={linkColor}
                linkWidth={linkWidth}
                linkDirectionalParticles={0}
                onNodeClick={handleNodeClick}
                onEngineStop={handleEngineStop}
                cooldownTicks={100}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                warmupTicks={50}
                enableNodeDrag={true}
                enableZoomInteraction={true}
                enablePanInteraction={true}
            />
        </div>
    )
}
