export interface FileItem {
    id: string
    name: string
    content: string
    type: 'cpp' | 'txt'
}

export interface Project {
    id: string
    user_id: string
    name: string
    description: string | null
    files: FileItem[]
    created_at: string
    updated_at: string
}
