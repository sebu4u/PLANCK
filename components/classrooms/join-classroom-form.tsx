"use client"

import { useFormStatus } from "react-dom"
import { joinClassroomAction } from "@/app/classrooms/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Joining..." : "Join classroom"}
    </Button>
  )
}

interface JoinClassroomFormProps {
  errorMessage?: string
}

export function JoinClassroomForm({ errorMessage }: JoinClassroomFormProps) {
  return (
    <Card className="border-[#eceff3]">
      <CardHeader>
        <CardTitle className="text-xl">Join a classroom</CardTitle>
        <CardDescription>Enter the code your teacher shared with you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={joinClassroomAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="join-code" className="text-sm font-medium text-[#111827]">
              Join code
            </label>
            <Input
              id="join-code"
              name="join_code"
              placeholder="ABC123"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={6}
              required
            />
          </div>
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
