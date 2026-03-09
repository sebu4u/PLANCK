export function toYoutubeEmbedUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null

  try {
    const url = new URL(rawUrl)
    const host = url.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim()
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v")
      if (id) return `https://www.youtube.com/embed/${id}`

      const pathParts = url.pathname.split("/").filter(Boolean)
      if (pathParts[0] === "embed" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`
      }
      if (pathParts[0] === "shorts" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`
      }
    }
  } catch {
    return null
  }

  return null
}
