"use client"

import { useFormStatus } from "react-dom"
import { createClassroomAction } from "@/app/classrooms/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CLASSROOM_GRADE_LABELS,
  CLASSROOM_GRADE_LEVELS,
  CLASSROOM_SUBJECT_LABELS,
  CLASSROOM_SUBJECTS,
  currentSchoolYear,
} from "@/lib/classrooms/constants"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Se creează…" : "Creează clasa"}
    </Button>
  )
}

interface CreateClassroomFormProps {
  errorMessage?: string
  coverFilenames: string[]
}

export function CreateClassroomForm({ errorMessage, coverFilenames }: CreateClassroomFormProps) {
  return (
    <Card className="border-[#eceff3]">
      <CardHeader>
        <CardTitle className="text-xl">Creează o clasă</CardTitle>
        <CardDescription>Elevii intră instant cu un cod de 6 caractere sau cu QR.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createClassroomAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="classroom-name" className="text-sm font-medium text-[#111827]">
              Numele clasei
            </label>
            <Input
              id="classroom-name"
              name="name"
              placeholder="Ex: Fizică IX A"
              maxLength={120}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="classroom-subject" className="text-sm font-medium text-[#111827]">
                Materie
              </label>
              <select
                id="classroom-subject"
                name="subject"
                className="h-10 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-sm"
                defaultValue="fizica"
              >
                {CLASSROOM_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {CLASSROOM_SUBJECT_LABELS[subject]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="classroom-grade" className="text-sm font-medium text-[#111827]">
                An de studiu
              </label>
              <select
                id="classroom-grade"
                name="grade_level"
                className="h-10 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-sm"
                defaultValue="IX"
              >
                {CLASSROOM_GRADE_LEVELS.map((grade) => (
                  <option key={grade} value={grade}>
                    {CLASSROOM_GRADE_LABELS[grade]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="classroom-section" className="text-sm font-medium text-[#111827]">
                Paralela
              </label>
              <Input id="classroom-section" name="section" placeholder="A" maxLength={1} />
            </div>
            <div className="space-y-2">
              <label htmlFor="classroom-year" className="text-sm font-medium text-[#111827]">
                An școlar
              </label>
              <Input id="classroom-year" name="school_year" defaultValue={currentSchoolYear()} maxLength={9} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[#111827]">Imagine de copertă</p>
            <p className="text-xs text-[#6b7280]">Apare în antetul clasei pentru toată lumea.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {coverFilenames.map((filename, index) => (
                <label
                  key={filename}
                  className="group cursor-pointer rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-2 transition-colors has-[:checked]:border-[#1a73e8] has-[:checked]:ring-2 has-[:checked]:ring-[#1a73e8]"
                >
                  <input
                    type="radio"
                    name="cover_image"
                    value={filename}
                    required
                    defaultChecked={index === 0}
                    className="sr-only"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/clase/${filename}`} alt="" className="h-24 w-full rounded-lg object-cover" />
                </label>
              ))}
            </div>
          </div>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
