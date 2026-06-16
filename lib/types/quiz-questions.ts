// TypeScript types for Quiz Questions (Teste Grilă)
// Completely isolated from the existing Problem types

export type AnswerKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type DifficultyLevel = 1 | 2 | 3;
export type GradeLevel = 9 | 10 | 11 | 12;
export type QuizMaterie = 'fizica' | 'biologie';

export interface QuizAnswers {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
    F: string;
}

export interface QuizQuestion {
    id: string;
    question_id: string;
    class: GradeLevel;
    statement: string;
    difficulty: DifficultyLevel;
    answers: QuizAnswers;
    correct_answer: AnswerKey;
    created_at: string;
    materie?: QuizMaterie | null;
    title?: string | null;
    description?: string | null;
    tags?: string[];
    correct_answers?: AnswerKey[];
    image_url?: string | null;
    video_url?: string | null;
}

// User answer state for a single question
export interface UserAnswer {
    questionId: string;
    selectedAnswers: AnswerKey[];
    isVerified: boolean;
    isCorrect: boolean | null;
}

// Quiz session state
export interface QuizSession {
    classLevel: GradeLevel;
    questions: QuizQuestion[];
    currentIndex: number;
    answers: Map<string, UserAnswer>;
}

// Difficulty labels in Romanian
export const difficultyLabels: Record<DifficultyLevel, string> = {
    1: 'Ușor',
    2: 'Mediu',
    3: 'Greu',
};

// Grade labels in Romanian
export const gradeLabels: Record<GradeLevel, string> = {
    9: 'Clasa a IX-a',
    10: 'Clasa a X-a',
    11: 'Clasa a XI-a',
    12: 'Clasa a XII-a',
};
