export interface Problem {
  id: string
  title: string
  description: string
  statement: string
  difficulty: string
  category: string
  tags: string
  youtube_url: string
  created_at: string
  class?: number
  classString?: string
  isFree?: boolean
  image_url?: string
}

// Problemele se preiau acum din Supabase, nu din acest fișier.
