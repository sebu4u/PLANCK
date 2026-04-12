import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StudentScoreRow {
  user_id: string
  name: string
  email: string
  correct: number
  total: number
  score: number
}

interface ProblemStatRow {
  problem_id: string
  title: string
  correctRate: number
}

interface StudentAnalyticsTableProps {
  rows: StudentScoreRow[]
  problemStats: ProblemStatRow[]
}

export function StudentAnalyticsTable({ rows, problemStats }: StudentAnalyticsTableProps) {
  return (
    <div className="space-y-4">
      <Card className="border-[#eceff3] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Progres elevi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Elev</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Corecte</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Scor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#6b7280]">
                    Încă nu există trimiteri de la elevi.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.user_id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.email || "-"}</TableCell>
                    <TableCell className="text-right">{row.correct}</TableCell>
                    <TableCell className="text-right">{row.total}</TableCell>
                    <TableCell className="text-right">{row.score}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-[#eceff3] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Statistici probleme</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problemă</TableHead>
                <TableHead className="text-right">Rată corecte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problemStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-[#6b7280]">
                    Încă nu există statistici.
                  </TableCell>
                </TableRow>
              ) : (
                problemStats.map((row) => (
                  <TableRow key={row.problem_id}>
                    <TableCell>{row.title}</TableCell>
                    <TableCell className="text-right">{row.correctRate}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
