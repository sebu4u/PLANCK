"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import type { GradeLevel } from '@/lib/types/quiz-questions';
import { gradeLabels } from '@/lib/types/quiz-questions';
import { BookOpen, GraduationCap, Atom, Beaker } from 'lucide-react';

interface ClassSelectorProps {
    onSelect: (classLevel: GradeLevel) => void;
}

const classIcons: Record<GradeLevel, React.ReactNode> = {
    9: <Atom className="h-8 w-8" />,
    10: <Beaker className="h-8 w-8" />,
    11: <BookOpen className="h-8 w-8" />,
    12: <GraduationCap className="h-8 w-8" />,
};

const classDescriptions: Record<GradeLevel, string> = {
    9: 'Mecanică, Optică',
    10: 'Termodinamică, Electricitate',
    11: 'Electrodinamică, Oscilații',
    12: 'Fizică atomică, Fizică nucleară',
};


const classIconColors: Record<GradeLevel, string> = {
    9: 'text-emerald-400',
    10: 'text-blue-400',
    11: 'text-purple-400',
    12: 'text-amber-400',
};

export function ClassSelector({ onSelect }: ClassSelectorProps) {
    const grades: GradeLevel[] = [9, 10, 11, 12];

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    Teste Grilă Fizică
                </h1>
                <p className="text-white/60 text-lg">
                    Alege clasa pentru a începe testul
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {grades.map((grade) => (
                    <Card
                        key={grade}
                        onClick={() => onSelect(grade)}
                        className={`
              relative cursor-pointer overflow-hidden
              border border-white/10 bg-[#13151a]
              backdrop-blur-sm rounded-2xl p-6
              transition-all duration-300 ease-out
              hover:border-white/20 hover:bg-[#1a1c24] hover:scale-[1.02] hover:shadow-xl
              group
            `}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl bg-white/10 ${classIconColors[grade]}`}>
                                {classIcons[grade]}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-white mb-1">
                                    {gradeLabels[grade]}
                                </h2>
                                <p className="text-gray-300 text-sm">
                                    {classDescriptions[grade]}
                                </p>
                            </div>
                        </div>

                        {/* Hover indicator */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white/60 text-sm font-medium">
                                Începe →
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
