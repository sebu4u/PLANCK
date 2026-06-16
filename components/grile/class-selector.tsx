"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import type { GradeLevel } from '@/lib/types/quiz-questions';
import { gradeLabels } from '@/lib/types/quiz-questions';
import { useGrileSubject } from './grile-subject-context';

interface ClassSelectorProps {
    onSelect: (classLevel: GradeLevel) => void;
}

export function ClassSelector({ onSelect }: ClassSelectorProps) {
    const { pageTitle, pageSubtitle, classDescriptions, classIcons } = useGrileSubject();
    const grades: GradeLevel[] = [9, 10, 11, 12];

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-[#111111] mb-3">
                    {pageTitle}
                </h1>
                <p className="text-[#6d6d6d] text-lg">
                    {pageSubtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {grades.map((grade) => {
                    const GradeIcon = classIcons[grade];
                    return (
                    <Card
                        key={grade}
                        onClick={() => onSelect(grade)}
                        className={`
              relative cursor-pointer overflow-hidden
              border border-gray-200 bg-white
              rounded-2xl p-6 shadow-sm
              transition-all duration-300 ease-out
              hover:border-gray-300 hover:bg-gray-50/80 hover:scale-[1.02] hover:shadow-md
              group
            `}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-gray-100 text-violet-700">
                                <GradeIcon className="h-8 w-8" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-[#111111] mb-1">
                                    {gradeLabels[grade]}
                                </h2>
                                <p className="text-[#6d6d6d] text-sm">
                                    {classDescriptions[grade]}
                                </p>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-violet-700 text-sm font-medium">
                                Începe →
                            </span>
                        </div>
                    </Card>
                )})}
            </div>
        </div>
    );
}
