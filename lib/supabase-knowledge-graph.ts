import { supabase } from '@/lib/supabaseClient'
import type { KnowledgeNode, KnowledgeEdge, GraphData, ForceGraphData, GraphNode, GraphLink } from '@/lib/types/knowledge-graph'

/**
 * Fetch all knowledge nodes and edges from Supabase
 * Computes relatedNodeIds for each node based on edges
 */
export async function getKnowledgeGraph(): Promise<GraphData> {
    const [nodesResult, edgesResult] = await Promise.all([
        supabase.from('knowledge_nodes').select('*').order('title'),
        supabase.from('knowledge_edges').select('*'),
    ])

    if (nodesResult.error) {
        console.error('Error fetching knowledge nodes:', nodesResult.error)
        throw nodesResult.error
    }
    if (edgesResult.error) {
        console.error('Error fetching knowledge edges:', edgesResult.error)
        throw edgesResult.error
    }

    const nodes = nodesResult.data || []
    const edges = edgesResult.data || []

    // Build adjacency map for each node (undirected graph)
    const adjacencyMap = new Map<string, Set<string>>()

    for (const edge of edges) {
        // Add both directions since graph is undirected
        if (!adjacencyMap.has(edge.source_node_id)) {
            adjacencyMap.set(edge.source_node_id, new Set())
        }
        if (!adjacencyMap.has(edge.target_node_id)) {
            adjacencyMap.set(edge.target_node_id, new Set())
        }
        adjacencyMap.get(edge.source_node_id)!.add(edge.target_node_id)
        adjacencyMap.get(edge.target_node_id)!.add(edge.source_node_id)
    }

    // Attach relatedNodeIds to each node
    const nodesWithRelations: KnowledgeNode[] = nodes.map((node) => ({
        ...node,
        relatedNodeIds: Array.from(adjacencyMap.get(node.id) || []),
    }))

    return { nodes: nodesWithRelations, edges }
}

/**
 * Transform GraphData to format expected by react-force-graph
 */
export function toForceGraphData(data: GraphData): ForceGraphData {
    const nodes: GraphNode[] = data.nodes.map((node) => ({
        id: node.id,
        title: node.title,
        type: node.type,
        difficulty: node.difficulty,
    }))

    const links: GraphLink[] = data.edges.map((edge) => ({
        source: edge.source_node_id,
        target: edge.target_node_id,
    }))

    return { nodes, links }
}

/**
 * Get recommendations for a selected node
 * Returns direct neighbors sorted by relevance:
 * 1. Same type (concept ↔ concept, formula ↔ formula)
 * 2. More shared connections = higher priority
 */
export function getNodeRecommendations(
    selectedNode: KnowledgeNode,
    allNodes: KnowledgeNode[]
): KnowledgeNode[] {
    const relatedIds = new Set(selectedNode.relatedNodeIds)
    const relatedNodes = allNodes.filter((n) => relatedIds.has(n.id))

    // Sort by relevance score
    return relatedNodes.sort((a, b) => {
        // Same type gets +100 points
        const aTypeScore = a.type === selectedNode.type ? 100 : 0
        const bTypeScore = b.type === selectedNode.type ? 100 : 0

        // Count shared connections (nodes that both are connected to)
        const aSharedConnections = a.relatedNodeIds.filter((id) =>
            relatedIds.has(id) && id !== a.id && id !== selectedNode.id
        ).length
        const bSharedConnections = b.relatedNodeIds.filter((id) =>
            relatedIds.has(id) && id !== b.id && id !== selectedNode.id
        ).length

        const aScore = aTypeScore + aSharedConnections * 10
        const bScore = bTypeScore + bSharedConnections * 10

        return bScore - aScore
    })
}

/**
 * Get a node by ID from the nodes array
 */
export function getNodeById(nodes: KnowledgeNode[], id: string): KnowledgeNode | undefined {
    return nodes.find((n) => n.id === id)
}

/**
 * Get color for node based on type
 */
export function getNodeColor(type: 'concept' | 'formula', isSelected: boolean, isHighlighted: boolean): string {
    if (isSelected) {
        return type === 'concept' ? '#60a5fa' : '#f472b6' // Brighter when selected
    }
    if (isHighlighted) {
        return type === 'concept' ? '#3b82f6' : '#ec4899' // Normal highlight
    }
    return type === 'concept' ? '#1e40af' : '#9d174d' // Dimmed default
}

/**
 * Get color for node based on difficulty
 */
export function getDifficultyColor(difficulty: 'basic' | 'intermediate' | 'advanced'): string {
    switch (difficulty) {
        case 'basic':
            return '#22c55e' // Green
        case 'intermediate':
            return '#f59e0b' // Amber
        case 'advanced':
            return '#ef4444' // Red
        default:
            return '#6b7280' // Gray
    }
}
