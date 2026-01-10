// Types for the physics knowledge graph system

export interface KnowledgeNode {
    id: string;
    title: string;
    type: 'concept' | 'formula';
    explanation: string;
    formula?: string | null;
    intuition?: string | null;
    common_mistake?: string | null;
    difficulty: 'basic' | 'intermediate' | 'advanced';
    created_at?: string;
    updated_at?: string;
    // Computed field from edges
    relatedNodeIds: string[];
}

export interface KnowledgeEdge {
    id: string;
    source_node_id: string;
    target_node_id: string;
    created_at?: string;
}

export interface GraphData {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
}

// For react-force-graph compatibility
export interface GraphNode {
    id: string;
    title: string;
    type: 'concept' | 'formula';
    difficulty: 'basic' | 'intermediate' | 'advanced';
    // Force graph computed positions - all optional
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number;
    fy?: number;
    // Allow additional properties
    [key: string]: unknown;
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
}

export interface ForceGraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}
