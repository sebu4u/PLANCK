// Supabase data fetching for Quiz Questions (Teste Grilă)
// Completely isolated from supabase-physics.ts

import { supabase } from './supabaseClient';
import type { QuizQuestion, GradeLevel } from './types/quiz-questions';

/**
 * Fetch all quiz questions for a specific grade level
 */
export async function fetchQuizQuestionsByClass(classLevel: GradeLevel): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('class', classLevel)
        .order('question_id', { ascending: true });

    if (error) {
        console.error('Error fetching quiz questions:', error);
        throw error;
    }

    return (data as QuizQuestion[]) || [];
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * Used to randomize question order at the start of a quiz session
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Mark a question as solved by the current user
 */
export async function markQuestionAsSolved(questionId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
        .from('user_solved_questions')
        .insert({
            user_id: user.id,
            question_id: questionId
        })
        .select(); // Select to ensure we get an error if it fails (e.g. duplicate)

    // Ignore duplicate key errors (code 23505) as it just means already solved
    if (error && error.code !== '23505') {
        console.error('Error marking question as solved:', error);
    }
}

/**
 * Fetch and shuffle quiz questions for a session
 * Excludes questions already solved by the user, unless all are solved
 */
export async function fetchAndShuffleQuestions(classLevel: GradeLevel): Promise<QuizQuestion[]> {
    // 1. Fetch all questions for the level
    const allQuestions = await fetchQuizQuestionsByClass(classLevel);

    // 2. Fetch solved questions for current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // If no user, just shuffle all
        return shuffleArray(allQuestions);
    }

    const { data: solvedData } = await supabase
        .from('user_solved_questions')
        .select('question_id')
        .eq('user_id', user.id);

    const solvedIds = new Set((solvedData || []).map(item => item.question_id));

    // 3. Filter out solved questions
    const unsolvedQuestions = allQuestions.filter(q => !solvedIds.has(q.id));

    // 4. Fallback logic
    if (unsolvedQuestions.length === 0) {
        // User solved everything (or there are no questions), return all questions shuffled
        // Maybe we want to persist specific logic here, but for now:
        return shuffleArray(allQuestions);
    }

    return shuffleArray(unsolvedQuestions);
}
