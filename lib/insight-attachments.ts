import type { SupabaseClient } from '@supabase/supabase-js';

export const INSIGHT_ATTACHMENTS_BUCKET = 'insight-attachments';

export const MAX_INSIGHT_ATTACHMENTS_PER_MESSAGE = 3;

/** Max encoded/original file size per image (enforced client-side; API validates path count only). */
export const MAX_INSIGHT_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const INSIGHT_ATTACHMENT_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type InsightAttachmentKind = 'solution_sheet';

export type InsightMessageAttachment = {
  bucket: string;
  path: string;
  mime: string;
  kind?: InsightAttachmentKind;
};

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

export function isSafeInsightStoragePath(path: string): boolean {
  if (!path || path.includes('..') || path.includes('\\')) return false;
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 3) return false;
  if (!IMAGE_EXT.test(parts[parts.length - 1]!)) return false;
  return true;
}

export function deriveMimeFromInsightPath(path: string): string | null {
  const lower = path.trim().toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return null;
}

/**
 * Validates each path is under the user's folder and tied to the given session.
 * Paths are object keys within the bucket: `{userId}/{sessionId}/{filename}`.
 */
export function validateInsightAttachmentPathsForSession(
  paths: string[],
  userId: string,
  sessionId: string
): boolean {
  if (paths.length === 0) return true;
  if (paths.length > MAX_INSIGHT_ATTACHMENTS_PER_MESSAGE) return false;
  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidLike.test(sessionId)) return false;

  for (const raw of paths) {
    const path = raw.trim();
    if (!isSafeInsightStoragePath(path)) return false;
    const parts = path.split('/').filter(Boolean);
    if (parts[0] !== userId || parts[1] !== sessionId) return false;
    if (!deriveMimeFromInsightPath(path)) return false;
  }
  return true;
}

export function buildInsightAttachmentRecords(paths: string[]): InsightMessageAttachment[] {
  const out: InsightMessageAttachment[] = [];
  for (const raw of paths) {
    const path = raw.trim();
    const mime = deriveMimeFromInsightPath(path);
    if (!mime) return [];
    out.push({
      bucket: INSIGHT_ATTACHMENTS_BUCKET,
      path,
      mime,
      kind: 'solution_sheet',
    });
  }
  return out;
}

export async function createSignedUrlsForInsightPaths(
  supabase: SupabaseClient,
  attachments: InsightMessageAttachment[] | null | undefined,
  expiresInSec = 900
): Promise<string[]> {
  if (!attachments?.length) return [];
  const urls: string[] = [];
  for (const a of attachments) {
    if (a.bucket !== INSIGHT_ATTACHMENTS_BUCKET) continue;
    const { data, error } = await supabase.storage
      .from(a.bucket)
      .createSignedUrl(a.path, expiresInSec);
    if (error || !data?.signedUrl) {
      throw new Error(`Nu am putut genera URL pentru atașament: ${error?.message ?? 'unknown'}`);
    }
    urls.push(data.signedUrl);
  }
  return urls;
}
