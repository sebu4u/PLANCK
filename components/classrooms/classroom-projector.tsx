"use client"

import { JoinCodeQr } from "@/components/classrooms/join-code-qr"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import type { AssignmentProblem } from "@/lib/classrooms/types"

interface ClassroomProjectorProps {
  classroomName: string
  joinCode: string
  problem: AssignmentProblem | null
}

export function ClassroomProjector({ classroomName, joinCode, problem }: ClassroomProjectorProps) {
  return (
    <div className="min-h-[70vh] space-y-8 rounded-2xl bg-[#0b1220] p-8 text-white">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">Ora de clasă</p>
          <h1 className="mt-2 text-4xl font-semibold">{classroomName}</h1>
        </div>
        <JoinCodeQr joinCode={joinCode} size={160} />
      </div>
      {problem ? (
        <div className="space-y-4 text-2xl leading-relaxed">
          <h2 className="text-3xl font-semibold">
            <LatexRichText content={problem.title} className="inline" />
          </h2>
          <div className="text-white/90">
            <LatexRichText content={problem.statement} />
          </div>
          {problem.grila_options ? (
            <ol className="list-decimal space-y-2 pl-8 text-xl">
              {problem.grila_options.map((option) => (
                <li key={option}>
                  <LatexRichText content={option} className="inline" />
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : (
        <p className="text-2xl text-white/70">Alege o problemă din tabloul orei ca să o afișezi aici.</p>
      )}
    </div>
  )
}
