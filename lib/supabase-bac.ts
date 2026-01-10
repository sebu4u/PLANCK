import { supabase } from '@/lib/supabaseClient'

// Tipuri pentru baza de date
export interface BacSubject {
    id: string
    year: number
    name: string
    pdf_url: string
    order_index: number
    is_active: boolean
    created_at: string
    updated_at: string
}

// Rezumat pentru listare în sidebar (fără pdf_url pentru performanță)
export interface BacSubjectSummary {
    id: string
    year: number
    name: string
    order_index: number
}

// Grupare pe ani
export interface BacYearGroup {
    year: number
    subjects: BacSubjectSummary[]
}

// Funcții pentru a obține datele din Supabase

/**
 * Obține toți anii disponibili cu subiecte
 */
export async function getAllBacYears(): Promise<number[]> {
    const { data, error } = await supabase
        .from('bac_subjects')
        .select('year')
        .eq('is_active', true)
        .order('year', { ascending: false })

    if (error) {
        console.error('Error fetching bac years:', error)
        return []
    }

    // Extrage anii unici
    const years = [...new Set(data?.map(item => item.year) || [])]
    return years
}

/**
 * Obține subiectele pentru un an specific
 */
export async function getBacSubjectsByYear(year: number): Promise<BacSubjectSummary[]> {
    const { data, error } = await supabase
        .from('bac_subjects')
        .select('id, year, name, order_index')
        .eq('year', year)
        .eq('is_active', true)
        .order('order_index')

    if (error) {
        console.error('Error fetching bac subjects by year:', error)
        return []
    }

    return (data || []) as BacSubjectSummary[]
}

/**
 * Obține toate subiectele grupate pe ani
 */
export async function getAllBacSubjectsGrouped(): Promise<BacYearGroup[]> {
    const { data, error } = await supabase
        .from('bac_subjects')
        .select('id, year, name, order_index')
        .eq('is_active', true)
        .order('year', { ascending: false })
        .order('order_index')

    if (error) {
        console.error('Error fetching all bac subjects:', error)
        return []
    }

    // Grupează pe ani
    const grouped: { [year: number]: BacSubjectSummary[] } = {}

    for (const subject of (data || [])) {
        if (!grouped[subject.year]) {
            grouped[subject.year] = []
        }
        grouped[subject.year].push(subject as BacSubjectSummary)
    }

    // Convertește în array de BacYearGroup
    return Object.entries(grouped)
        .map(([year, subjects]) => ({
            year: parseInt(year),
            subjects
        }))
        .sort((a, b) => b.year - a.year) // Cel mai recent an primul
}

/**
 * Obține un subiect specific cu toate detaliile (inclusiv pdf_url)
 */
export async function getBacSubjectById(id: string): Promise<BacSubject | null> {
    const { data, error } = await supabase
        .from('bac_subjects')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

    if (error) {
        console.error('Error fetching bac subject:', error)
        return null
    }

    return data as BacSubject
}

/**
 * Obține toate subiectele ca listă plată (pentru navigare)
 */
export async function getAllBacSubjectsFlat(): Promise<BacSubjectSummary[]> {
    const { data, error } = await supabase
        .from('bac_subjects')
        .select('id, year, name, order_index')
        .eq('is_active', true)
        .order('year', { ascending: false })
        .order('order_index')

    if (error) {
        console.error('Error fetching all bac subjects flat:', error)
        return []
    }

    return (data || []) as BacSubjectSummary[]
}
