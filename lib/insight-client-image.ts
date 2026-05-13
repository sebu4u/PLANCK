/**
 * Browser-only helpers for Insight image attachments (compress + WebP/JPEG).
 * Import only from client components.
 */

import {
  MAX_INSIGHT_ATTACHMENT_BYTES,
  MAX_INSIGHT_ATTACHMENTS_PER_MESSAGE,
} from '@/lib/insight-attachments'

export { MAX_INSIGHT_ATTACHMENT_BYTES, MAX_INSIGHT_ATTACHMENTS_PER_MESSAGE }

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality)
  })
}

/**
 * Decode, resize, encode as WebP (if supported) else JPEG, and shrink until <= maxBytes when possible.
 */
export async function prepareInsightImageForUpload(
  file: File,
  options?: { maxEdge?: number }
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('INVALID_TYPE')
  }
  if (file.size > MAX_INSIGHT_ATTACHMENT_BYTES) {
    throw new Error('FILE_TOO_LARGE')
  }
  if (typeof createImageBitmap !== 'function') {
    if (file.size > MAX_INSIGHT_ATTACHMENT_BYTES) {
      throw new Error('FILE_TOO_LARGE')
    }
    return file
  }

  const maxEdge = options?.maxEdge ?? 2000
  const bmp = await createImageBitmap(file)
  try {
    let scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
    let webpQuality = 0.86
    let jpegQuality = 0.88

    for (let attempt = 0; attempt < 12; attempt++) {
      const w = Math.max(1, Math.round(bmp.width * scale))
      const h = Math.max(1, Math.round(bmp.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return file
      }
      ctx.drawImage(bmp, 0, 0, w, h)

      let blob: Blob | null = await canvasToBlob(canvas, 'image/webp', webpQuality)
      let mime: string = 'image/webp'
      let ext = 'webp'

      if (!blob || blob.size < 100) {
        blob = await canvasToBlob(canvas, 'image/jpeg', jpegQuality)
        mime = 'image/jpeg'
        ext = 'jpg'
      }

      if (!blob) {
        blob = await canvasToBlob(canvas, 'image/jpeg', Math.min(0.95, jpegQuality + 0.05))
        mime = 'image/jpeg'
        ext = 'jpg'
      }

      if (blob && blob.size > 0 && blob.size <= MAX_INSIGHT_ATTACHMENT_BYTES) {
        const base = file.name.replace(/\.[^.]+$/, '') || 'image'
        return new File([blob], `${base}.${ext}`, { type: mime })
      }

      if (blob && blob.size > MAX_INSIGHT_ATTACHMENT_BYTES) {
        if (webpQuality > 0.45) {
          webpQuality -= 0.08
          jpegQuality -= 0.06
        } else {
          scale *= 0.82
        }
        continue
      }

      const fallback = await canvasToBlob(canvas, 'image/jpeg', 0.72)
      if (fallback && fallback.size <= MAX_INSIGHT_ATTACHMENT_BYTES) {
        const base = file.name.replace(/\.[^.]+$/, '') || 'image'
        return new File([fallback], `${base}.jpg`, { type: 'image/jpeg' })
      }
      scale *= 0.75
    }

    throw new Error('ENCODE_TOO_LARGE')
  } finally {
    bmp.close()
  }
}
