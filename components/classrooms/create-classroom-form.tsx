"use client"

import { useFormStatus } from "react-dom"
import { createClassroomAction } from "@/app/classrooms/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Creating..." : "Create classroom"}
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
        <CardTitle className="text-xl">Create a classroom</CardTitle>
        <CardDescription>Students will join instantly using a 6-character code.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createClassroomAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="classroom-name" className="text-sm font-medium text-[#111827]">
              Classroom name
            </label>
            <Input
              id="classroom-name"
              name="name"
              placeholder="Ex: Clasa 11A - Mecanică"
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[#111827]">Cover image</p>
            <p className="text-xs text-[#6b7280]">This image stays on the class header for everyone.</p>
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
                  <img
                    src={`/clase/${filename}`}
                    alt=""
                    className="h-24 w-full rounded-lg object-cover"
                  />
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
