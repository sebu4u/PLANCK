import 'server-only';

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createSignedUrlsForInsightPaths,
  type InsightMessageAttachment,
} from '@/lib/insight-attachments';
import { logger } from '@/lib/logger';

const OCR_MINI_MODEL = 'gpt-4o-mini';
const OCR_FALLBACK_MODEL = 'gpt-4o';

const OCR_SYSTEM_PROMPT = `Ești un asistent specializat în extragerea conținutului din fotografii cu probleme de fizică, matematică sau informatică (manuale, caiete, foi scrise de mână).

Pentru fiecare imagine, extrage:
1) Enunțul problemei (dacă există)
2) Datele numerice și unitățile de măsură
3) Formulele și expresiile — scrie-le în LaTeX între $...$ (inline) sau $$...$$ (block)
4) Pașii de rezolvare scris de mână (transcrie cât mai fidel)
5) Diagrame sau desene relevante (descriere scurtă)

Dacă o zonă e ilizibilă, marchează explicit: [ILIZIBIL: descriere zonă]

Răspunde DOAR cu textul extras, fără comentarii meta. Dacă sunt mai multe imagini, separă cu:

--- IMAGINE N ---

unde N este numărul imaginii (1, 2, 3).`;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for Insight image OCR.');
  }
  return new OpenAI({ apiKey });
}

function isOcrResultUsable(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 12) return false;
  if (/^(\[ILIZIBIL|ilizibil|nu pot)/i.test(trimmed) && trimmed.length < 40) return false;
  return true;
}

function splitOcrByImageMarkers(combined: string, imageCount: number): string[] {
  if (imageCount <= 1) {
    return [combined.trim()];
  }

  const parts: string[] = [];
  for (let i = 1; i <= imageCount; i++) {
    const marker = `--- IMAGINE ${i} ---`;
    const nextMarker = i < imageCount ? `--- IMAGINE ${i + 1} ---` : null;
    const startIdx = combined.indexOf(marker);
    if (startIdx === -1) continue;
    const contentStart = startIdx + marker.length;
    const endIdx = nextMarker ? combined.indexOf(nextMarker, contentStart) : combined.length;
    const slice = combined.slice(contentStart, endIdx === -1 ? undefined : endIdx).trim();
    if (slice) parts.push(slice);
  }

  if (parts.length === imageCount) {
    return parts;
  }

  return Array.from({ length: imageCount }, () => combined.trim());
}

async function runVisionOcr(signedUrls: string[], model: string): Promise<string> {
  const openai = getOpenAIClient();
  const imageParts = signedUrls.map((url) => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'high' as const },
  }));

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: OCR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              signedUrls.length === 1
                ? 'Extrage tot conținutul relevant din această imagine.'
                : `Extrage conținutul din cele ${signedUrls.length} imagini, folosind markerii --- IMAGINE N ---.`,
          },
          ...imageParts,
        ],
      },
    ],
    max_tokens: 4000,
  });

  return completion.choices[0]?.message?.content?.trim() ?? '';
}

/**
 * Runs OpenAI vision OCR on signed image URLs. Returns one text block per image.
 */
export async function extractInsightImageTexts(signedUrls: string[]): Promise<string[]> {
  if (signedUrls.length === 0) return [];

  let combined = await runVisionOcr(signedUrls, OCR_MINI_MODEL);
  if (!isOcrResultUsable(combined)) {
    logger.info('Insight OCR: retrying with gpt-4o fallback');
    combined = await runVisionOcr(signedUrls, OCR_FALLBACK_MODEL);
  }

  if (!isOcrResultUsable(combined)) {
    throw new Error('OCR_EMPTY');
  }

  return splitOcrByImageMarkers(combined, signedUrls.length);
}

/**
 * Enriches attachment records with ocrText (per image). Reuses existing ocrText when present.
 */
export async function enrichInsightAttachmentsWithOcr(
  supabase: SupabaseClient,
  attachments: InsightMessageAttachment[]
): Promise<InsightMessageAttachment[]> {
  if (attachments.length === 0) return attachments;

  const needsOcr = attachments.some((a) => !a.ocrText?.trim());
  if (!needsOcr) return attachments;

  const toOcr = attachments.filter((a) => !a.ocrText?.trim());
  const signedUrls = await createSignedUrlsForInsightPaths(supabase, toOcr);
  const ocrTexts = await extractInsightImageTexts(signedUrls);

  let ocrIdx = 0;
  return attachments.map((a) => {
    if (a.ocrText?.trim()) return a;
    const ocrText = ocrTexts[ocrIdx] ?? ocrTexts[ocrTexts.length - 1] ?? '';
    ocrIdx += 1;
    return { ...a, ocrText: ocrText.trim() || undefined };
  });
}

export type OcrUsageMetrics = {
  inputTokens: number;
  outputTokens: number;
};

/** OCR with token usage for cost logging. */
export async function enrichInsightAttachmentsWithOcrAndUsage(
  supabase: SupabaseClient,
  attachments: InsightMessageAttachment[]
): Promise<{ attachments: InsightMessageAttachment[]; ocrUsage: OcrUsageMetrics | null }> {
  if (attachments.length === 0) {
    return { attachments, ocrUsage: null };
  }

  const needsOcr = attachments.some((a) => !a.ocrText?.trim());
  if (!needsOcr) {
    return { attachments, ocrUsage: null };
  }

  const toOcr = attachments.filter((a) => !a.ocrText?.trim());
  const signedUrls = await createSignedUrlsForInsightPaths(supabase, toOcr);

  const openai = getOpenAIClient();
  const imageParts = signedUrls.map((url) => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'high' as const },
  }));

  let completion = await openai.chat.completions.create({
    model: OCR_MINI_MODEL,
    messages: [
      { role: 'system', content: OCR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              signedUrls.length === 1
                ? 'Extrage tot conținutul relevant din această imagine.'
                : `Extrage conținutul din cele ${signedUrls.length} imagini, folosind markerii --- IMAGINE N ---.`,
          },
          ...imageParts,
        ],
      },
    ],
    max_tokens: 4000,
  });

  let combined = completion.choices[0]?.message?.content?.trim() ?? '';
  if (!isOcrResultUsable(combined)) {
    completion = await openai.chat.completions.create({
      model: OCR_FALLBACK_MODEL,
      messages: [
        { role: 'system', content: OCR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                signedUrls.length === 1
                  ? 'Extrage tot conținutul relevant din această imagine.'
                  : `Extrage conținutul din cele ${signedUrls.length} imagini, folosind markerii --- IMAGINE N ---.`,
            },
            ...imageParts,
          ],
        },
      ],
      max_tokens: 4000,
    });
    combined = completion.choices[0]?.message?.content?.trim() ?? '';
  }

  if (!isOcrResultUsable(combined)) {
    throw new Error('OCR_EMPTY');
  }

  const ocrTexts = splitOcrByImageMarkers(combined, signedUrls.length);
  let ocrIdx = 0;
  const enriched = attachments.map((a) => {
    if (a.ocrText?.trim()) return a;
    const ocrText = ocrTexts[ocrIdx] ?? ocrTexts[ocrTexts.length - 1] ?? '';
    ocrIdx += 1;
    return { ...a, ocrText: ocrText.trim() || undefined };
  });

  return {
    attachments: enriched,
    ocrUsage: {
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    },
  };
}
