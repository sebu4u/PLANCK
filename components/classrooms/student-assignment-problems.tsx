import Link from "next/link"
import { submitAssignmentAnswerAction, syncCatalogSolvedProblemAction } from "@/app/classrooms/actions"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AssignmentProblem, AssignmentSubmission } from "@/lib/classrooms/types"

interface StudentAssignmentProblemsProps {
  classroomId: string
  assignmentId: string
  problems: AssignmentProblem[]
  submissions: AssignmentSubmission[]
}

function TeacherOnlyPhotosControl({ attachmentCount }: { attachmentCount: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-[#d1d5db] bg-[#f9fafb] p-3">
      <p className="text-xs font-medium text-[#374151]">
        Poze pentru profesor{" "}
        <span className="font-normal text-[#6b7280]">
          (opțional, max. 5, JPG/PNG/WebP/GIF, fiecare max. 5&nbsp;MB)
        </span>
      </p>
      <input
        type="file"
        name="teacher_photos"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="block w-full text-sm text-[#374151] file:mr-3 file:rounded-md file:border-0 file:bg-[#e5e7eb] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#111827] hover:file:bg-[#d1d5db]"
      />
      {attachmentCount > 0 ? (
        <p className="text-xs text-[#059669]">
          Ai {attachmentCount} {attachmentCount === 1 ? "foto trimisă" : "fotografii trimise"} pentru această
          problemă — le vede doar profesorul. Lasă câmpul gol ca să le păstrezi; alege altele ca să le
          înlocuiești.
        </p>
      ) : (
        <p className="text-xs text-[#6b7280]">Nu sunt vizibile celorlalți elevi.</p>
      )}
    </div>
  )
}

export function StudentAssignmentProblems({
  classroomId,
  assignmentId,
  problems,
  submissions,
}: StudentAssignmentProblemsProps) {
  const submissionByProblem = new Map(submissions.map((submission) => [submission.problem_id, submission]))

  return (
    <div className="space-y-4">
      {problems.map((problem, problemIndex) => {
        const existing = submissionByProblem.get(problem.id)
        const existingAnswer = existing?.answer ?? ""
        const teacherAttachmentCount = existing?.teacher_attachment_count ?? 0
        const isGrila = problem.answer_type === "grila"
        const isValue = problem.answer_type === "value"
        const valueAnswers = (() => {
          try {
            return JSON.parse(existingAnswer) as number[]
          } catch {
            return []
          }
        })()

        return (
          <Card key={problem.id} className="border-[#eceff3] bg-white">
            <CardHeader className="pb-3">
              <div className="text-base font-semibold leading-snug text-[#111827]">
                <span className="font-semibold">Problemă {problemIndex + 1}: </span>
                <LatexRichText content={problem.title} className="inline align-baseline font-semibold" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm leading-relaxed text-[#374151] [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden">
                <LatexRichText content={problem.statement} />
              </div>

              {isGrila ? (
                <form action={submitAssignmentAnswerAction} className="space-y-4">
                  <input type="hidden" name="classroom_id" value={classroomId} />
                  <input type="hidden" name="assignment_id" value={assignmentId} />
                  <input type="hidden" name="problem_id" value={problem.id} />
                  <input
                    type="hidden"
                    name="redirect_to"
                    value={`/classrooms/${classroomId}/assignments/${assignmentId}`}
                  />

                  <div className="space-y-2">
                    {(problem.grila_options ?? []).map((option, optionIndex) => (
                      <label
                        key={`${problem.id}-${optionIndex}`}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e5e7eb] px-3 py-2 hover:bg-[#fafafa]"
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={String(optionIndex)}
                          defaultChecked={existingAnswer === String(optionIndex)}
                          required
                          className="mt-1"
                        />
                        <span className="text-sm text-[#111827]">
                          <LatexRichText content={option} className="inline" />
                        </span>
                      </label>
                    ))}
                  </div>

                  <TeacherOnlyPhotosControl attachmentCount={teacherAttachmentCount} />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit">{existing ? "Actualizează răspunsul" : "Trimite răspunsul"}</Button>
                    {existing ? (
                      <span
                        className={`text-sm font-medium ${
                          existing.is_correct ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {existing.is_correct ? "Răspuns corect" : "Răspuns greșit"}
                      </span>
                    ) : null}
                  </div>
                </form>
              ) : null}

              {isValue ? (
                <form action={submitAssignmentAnswerAction} className="space-y-4">
                  <input type="hidden" name="classroom_id" value={classroomId} />
                  <input type="hidden" name="assignment_id" value={assignmentId} />
                  <input type="hidden" name="problem_id" value={problem.id} />
                  <input
                    type="hidden"
                    name="redirect_to"
                    value={`/classrooms/${classroomId}/assignments/${assignmentId}`}
                  />

                  <div className="space-y-3">
                    {(problem.value_subpoints ?? []).map((subpoint, subpointIndex) => (
                      <div key={`${problem.id}-subpoint-${subpointIndex}`} className="rounded-lg border border-[#e5e7eb] p-3">
                        <label className="mb-2 block text-sm font-medium text-[#111827]">
                          <LatexRichText
                            content={subpoint.label || `Subpunct ${subpointIndex + 1}`}
                            className="inline font-medium"
                          />
                        </label>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[#374151]">
                          <LatexRichText content={subpoint.text_before} className="inline" />
                          <input
                            name={`value_answer_${subpointIndex}`}
                            type="number"
                            step="any"
                            required
                            defaultValue={typeof valueAnswers[subpointIndex] === "number" ? valueAnswers[subpointIndex] : ""}
                            className="h-10 w-40 rounded-md border border-[#d1d5db] px-3"
                          />
                          <LatexRichText content={subpoint.text_after} className="inline" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <TeacherOnlyPhotosControl attachmentCount={teacherAttachmentCount} />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit">{existing ? "Actualizează răspunsul" : "Trimite răspunsul"}</Button>
                    {existing ? (
                      <span
                        className={`text-sm font-medium ${
                          existing.is_correct ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {existing.is_correct ? "Răspuns corect" : "Răspuns greșit"}
                      </span>
                    ) : null}
                  </div>
                </form>
              ) : null}

              {!isGrila && !isValue ? (
                <div className="space-y-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                  <p className="text-sm text-[#4b5563]">
                    Această problemă se rezolvă în catalogul principal. Deschide-o acolo, rezolv-o, apoi
                    sincronizează rezultatul cu această temă.
                  </p>
                  <form action={syncCatalogSolvedProblemAction} className="space-y-3">
                    <input type="hidden" name="classroom_id" value={classroomId} />
                    <input type="hidden" name="assignment_id" value={assignmentId} />
                    <input type="hidden" name="problem_id" value={problem.id} />
                    <input
                      type="hidden"
                      name="redirect_to"
                      value={`/classrooms/${classroomId}/assignments/${assignmentId}`}
                    />
                    <TeacherOnlyPhotosControl attachmentCount={teacherAttachmentCount} />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button asChild variant="outline" type="button">
                        <Link href={`/probleme/${problem.id}`}>Deschide în catalog</Link>
                      </Button>
                      <Button type="submit">Sincronizează statusul</Button>
                      {existing ? (
                        <span className="text-sm font-medium text-emerald-600">
                          {existing.is_correct ? "Sincronizat din catalog" : "Trimitere salvată"}
                        </span>
                      ) : null}
                    </div>
                  </form>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
