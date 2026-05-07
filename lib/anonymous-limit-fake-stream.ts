/**
 * Simulated SSE stream when anonymous users exceed daily/monthly limits.
 * Does not call OpenAI; streams plausible-looking placeholder text for UX only.
 */

import type { NextRequest } from 'next/server';

function randomChunkSize(): number {
  return 10 + Math.floor(Math.random() * 14);
}

export function chunkTextForFakeStream(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const n = Math.min(randomChunkSize(), text.length - i);
    chunks.push(text.slice(i, i + n));
    i += n;
  }
  return chunks;
}

function buildPlaceholderInsightText(persona: string | null | undefined, mode: unknown): string {
  const p = persona ?? '';

  if (p === 'ide') {
    return [
      'Analizând structura cerinței și fișierul activ, observ că trebuie să clarificăm mai întâi ipotezele de lucru.',
      '\n\n',
      'Pasul 1: verifică citirea datelor și tipurile folosite în `main`. ',
      'Pasul 2: izolează bucla sau condiția care produce comportamentul neașteptat.',
      '\n\n',
      'Poți încerca o variantă minimală care citește un singur caz de test, apoi extinzi. ',
      'Dacă folosești tablouri fixe, atenție la indexare și la limitele buclelor.',
      '\n\n',
      'Exemplu de schelet (conceptual, fără detalii complete): citește n, apoi parcurge valorile și actualizează suma parțială.',
      '\n\n',
      'Verifică și complexitatea: pentru constrângeri stricte, o abordare greedy nu întotdeauna convine; uneori sortarea sau un dicționar ajută.',
    ].join('');
  }

  if (p === 'problem_tutor' || p === 'lesson_tutor') {
    return [
      'În această problemă, este util să identifici mai întâi mărimile conservate și sistemul de referință.',
      '\n\n',
      'Notăm cu $v_0$ viteza inițială și analizăm forțele care lucrează pe direcția mișcării: $F_{rez}$ apare din combinația componentelor.',
      '\n\n',
      'Aplicând teorema energiei cinetice între două poziții, obții o relație de forma ',
      '$$\\Delta E_c = W_{ext}$$',
      ' care leagă deplasarea de variația vitezei.',
      '\n\n',
      'Următorul pas este să verifici unitățile de măsură și consistența semnelor înainte de a înlocui numeric.',
      '\n\n',
      'Dacă apare frecare, modelul $F_f = \\mu N$ trebuie aliniat cu direcția mișcării și cu versorul normalei la suprafață.',
    ].join('');
  }

  return [
    'Putem aborda întrebarea pornind de la principiile fundamentale care guvernează fenomenul descris.',
    '\n\n',
    'În multe cazuri din mecanică, conservarea energiei sau teorema impuls–variația impulsului simplifică raționamentul.',
    '\n\n',
    'Notând $m$ masa și $a$ accelerația, ecuația scalară pe direcția mișcării poate fi scrisă ca $F = m a$ după proiecție.',
    '\n\n',
    'Verifică întotdeauna ipotezele modelului: corp punctiform, frecare neglijabilă, sau forțe exterioare date.',
    '\n\n',
    'Pasul următor ar fi să exprimi legile în coordonate alese și să reduci numărul de necunoscute înainte de calcule numerice.',
    '\n\n',
    'Dacă contextul implică circuite, analizează mai întâi nodurile și ochiurile înainte de a combina rezistențele echivalente.',
  ].join('');
}

export function createAnonymousLimitExceededStream(
  req: NextRequest,
  setCookieHeader: string | null,
  opts: { persona?: string | null; mode?: unknown; resetTime?: string }
): Response {
  const fullText = buildPlaceholderInsightText(opts.persona, opts.mode);
  const chunks = chunkTextForFakeStream(fullText);
  const encoder = new TextEncoder();
  const abortSignal = req.signal;

  const readable = new ReadableStream({
    async start(controller) {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      try {
        for (const chunk of chunks) {
          if (abortSignal?.aborted) break;
          await sleep(16 + Math.random() * 28);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`)
          );
        }

        if (!abortSignal?.aborted) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                sessionId: null,
                anonLimitReached: true,
                resetTime: opts.resetTime ?? null,
              })}\n\n`
            )
          );
        }
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Întrerupt.' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };
  if (setCookieHeader) {
    headers['Set-Cookie'] = setCookieHeader;
  }

  return new Response(readable, { headers });
}
