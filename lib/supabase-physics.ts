import { supabase } from '@/lib/supabaseClient'

// Tipuri pentru baza de date
export interface Grade {
  id: string
  grade_number: number
  name: string
  description: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  grade_id: string
  title: string
  description: string | null
  order_index: number
  is_active: boolean
  estimated_duration: number | null
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  chapter_id: string
  title: string
  content: string
  order_index: number
  difficulty_level: number | null
  estimated_duration: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// Rezumat pentru listare în sidebar (fără content)
export interface LessonSummary {
  id: string
  chapter_id: string
  title: string
  order_index: number
  difficulty_level: number | null
  estimated_duration: number | null
  is_active: boolean
}

// Funcții pentru a obține datele din Supabase

export async function getAllGrades(): Promise<Grade[]> {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('is_active', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching grades:', error)
    return []
  }

  return data || []
}

export async function getGradeById(id: string): Promise<Grade | null> {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching grade:', error)
    return null
  }

  return data
}

export async function getGradeByNumber(gradeNumber: number): Promise<Grade | null> {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('grade_number', gradeNumber)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching grade by number:', error)
    return null
  }

  return data
}

export async function getChaptersByGradeId(gradeId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('grade_id', gradeId)
    .eq('is_active', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching chapters:', error)
    return []
  }

  return data || []
}

export async function getChapterById(id: string): Promise<Chapter | null> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching chapter:', error)
    return null
  }

  return data
}

export async function getLessonsByChapterId(chapterId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('chapter_id', chapterId)
    .eq('is_active', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching lessons:', error)
    return []
  }

  return data || []
}

// Obține doar metadatele lecțiilor (fără content)
export async function getLessonSummariesByChapterId(chapterId: string): Promise<LessonSummary[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, chapter_id, title, order_index, difficulty_level, estimated_duration, is_active')
    .eq('chapter_id', chapterId)
    .eq('is_active', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching lesson summaries:', error)
    return []
  }

  return (data || []) as LessonSummary[]
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching lesson:', error)
    return null
  }

  return data
}

// Funcții pentru a obține datele complete cu relații

export async function getGradeWithChapters(gradeId: string): Promise<{
  grade: Grade | null
  chapters: Chapter[]
}> {
  const grade = await getGradeById(gradeId)
  const chapters = grade ? await getChaptersByGradeId(gradeId) : []
  
  return { grade, chapters }
}

export async function getChapterWithLessons(chapterId: string): Promise<{
  chapter: Chapter | null
  lessons: Lesson[]
}> {
  const chapter = await getChapterById(chapterId)
  const lessons = chapter ? await getLessonsByChapterId(chapterId) : []
  
  return { chapter, lessons }
}

export async function getFullGradeData(gradeId: string): Promise<{
  grade: Grade | null
  chapters: Array<Chapter & { lessons: Lesson[] }>
}> {
  const { grade, chapters } = await getGradeWithChapters(gradeId)
  
  if (!grade) {
    return { grade: null, chapters: [] }
  }

  const chaptersWithLessons = await Promise.all(
    chapters.map(async (chapter) => {
      const lessons = await getLessonsByChapterId(chapter.id)
      return { ...chapter, lessons }
    })
  )

  return { grade, chapters: chaptersWithLessons }
}

// Funcții pentru progresul utilizatorului (pentru viitor)
export async function getUserProgress(userId: string, lessonId: string): Promise<{
  completed: boolean
  progress: number
  lastAccessed: string | null
}> {
  // Această funcție va fi implementată când vom adăuga sistemul de progres
  // Pentru moment, returnăm date mock
  return {
    completed: false,
    progress: 0,
    lastAccessed: null
  }
}

export async function markLessonAsCompleted(userId: string, lessonId: string): Promise<boolean> {
  // Această funcție va fi implementată când vom adăuga sistemul de progres
  // Pentru moment, returnăm true
  return true
}

export async function updateLessonProgress(userId: string, lessonId: string, progress: number): Promise<boolean> {
  // Această funcție va fi implementată când vom adăuga sistemul de progres
  // Pentru moment, returnăm true
  return true
}
