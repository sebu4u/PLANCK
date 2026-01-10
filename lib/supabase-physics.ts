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

// Obține toate lecțiile finalizate de un utilizator
export async function getUserCompletedLessons(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching completed lessons:', error)
    return []
  }

  return data.map(row => row.lesson_id)
}

export async function markLessonAsCompleted(userId: string, lessonId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_lesson_progress')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      completed_at: new Date().toISOString()
    })
    .select()

  if (error) {
    // Dacă eroarea este de duplicat (cod 23505), considerăm operațiunea reușită
    if (error.code === '23505') return true
    console.error('Error marking lesson as completed:', error)
    return false
  }

  return true
}

export async function getUserProgress(userId: string, lessonId: string): Promise<{
  completed: boolean
  progress: number
  lastAccessed: string | null
}> {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 înseamnă că nu a găsit rânduri (nu e eroare)
    console.error('Error fetching lesson progress:', error)
  }

  return {
    completed: !!data,
    progress: data ? 100 : 0,
    lastAccessed: data?.completed_at || null
  }
}

export async function updateLessonProgress(userId: string, lessonId: string, progress: number): Promise<boolean> {
  // Momentan permitem doar marcare ca complet (100%), nu și procente intermediare
  if (progress >= 100) {
    return markLessonAsCompleted(userId, lessonId)
  }
  return true
}

// Obține lecții random pentru dashboard
export async function getRandomLessonsForDashboard(count: number = 3): Promise<{
  id: string
  title: string
  chapter_title: string
  grade_number: number
  estimated_duration: number | null
}[]> {
  // Fetch all lessons with chapter and grade info
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      estimated_duration,
      chapter_id,
      chapters!inner (
        title,
        grade_id,
        grades!inner (
          grade_number
        )
      )
    `)
    .eq('is_active', true)

  if (error || !lessons || lessons.length === 0) {
    console.error('Error fetching random lessons:', error)
    return []
  }

  // Shuffle and pick random lessons
  const shuffled = lessons.sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  return selected.map((lesson: any) => ({
    id: lesson.id,
    title: lesson.title,
    chapter_title: lesson.chapters?.title || 'Capitol',
    grade_number: lesson.chapters?.grades?.grade_number || 9,
    estimated_duration: lesson.estimated_duration,
  }))
}
