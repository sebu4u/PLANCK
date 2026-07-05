import { NextResponse } from "next/server"
import { loadLearningPathItemPayload } from "@/lib/learning-path-item-loader"
import { parseFizicaMapItemContext } from "@/lib/fizica-map-item-navigation"
import { parseAnySubjectMapItemContext } from "@/lib/subject-map/navigation"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; lessonSlug: string; itemIndex: string }> }
) {
  try {
    const { chapterSlug, lessonSlug, itemIndex } = await params
    const parsedIndex = Number.parseInt(itemIndex, 10)
    const fizicaMapContext = parseFizicaMapItemContext(new URL(request.url).searchParams)
    const subjectMapContext = parseAnySubjectMapItemContext(new URL(request.url).searchParams)

    const result = await loadLearningPathItemPayload(chapterSlug, lessonSlug, parsedIndex, {
      fizicaMapContext,
      subjectMapContext,
    })

    switch (result.status) {
      case "ok":
        return NextResponse.json(result.payload, {
          headers: { "Cache-Control": "private, no-store" },
        })
      case "blocked":
        return NextResponse.json(
          { error: "blocked", lessonBaseHref: result.lessonBaseHref },
          { status: 403 }
        )
      case "locked":
        return NextResponse.json({ error: "locked" }, { status: 403 })
      case "invalid_index":
      case "not_found":
      default:
        return NextResponse.json({ error: "not_found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error in learning path item API:", error)
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
  }
}
