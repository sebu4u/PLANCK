import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { estimateCostUSD } from '@/lib/insight-cost';
import {
  INSIGHT_PROBLEM_TUTOR_TEMPERATURE,
  isInsightIdeFastModel,
  resolveInsightModel,
  shouldUseRaptorFreeTierLimits,
} from '@/lib/insight-limits';
import { reserveAnonymousInsightUsage } from '@/lib/insight-usage-reserve';
import { logger } from '@/lib/logger';
import {
  buildAnonymousInsightCookieHeader,
  nextUtcMidnightIso,
  resolveAnonymousIdentity,
} from '@/lib/anonymous-insight';
import { getServiceRoleSupabase } from '@/lib/supabaseServiceRole';
import { createAnonymousLimitExceededStream } from '@/lib/anonymous-limit-fake-stream';
import {
  buildIdeAgentSystemPrompt,
  deepseekThinkingExtra,
  getIdeAgentClient,
  getIdeAgentFlashModel,
  normalizeIdeConversation,
  resolveIdeAgentModel,
  shouldEnableDeepseekThinking,
} from '@/lib/planckcode/ide-agent';
import { extractInsightImageTexts, shouldSkipProblemFigureOcr } from '@/lib/insight-image-ocr';
import {
  buildLessonTutorSystemPrompt,
  buildProblemTutorSystemPrompt,
  resolveProblemTutorSubject,
} from '@/lib/insight-problem-tutor-prompt';

function isSafePublicProblemImageUrl(url: string): boolean {
  if (!url || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function appendProblemFigureOcr(baseText: string, ocrText: string): string {
  const base = baseText.trim();
  const ocr = ocrText.trim();
  if (!ocr) return base;
  const block = `--- CONȚINUT EXTRAS DIN IMAGINEA ENUNȚULUI ---\n${ocr}`;
  return base ? `${base}\n\n${block}` : block;
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.'
    );
  }
  return new OpenAI({ apiKey });
}

function toChatCompletionsMessages(messages: Array<{ role: string; content: string }>) {
  return messages.map((m) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));
}

async function postAlertIfNeeded(totalMonthly: number) {
  const limit = Number(process.env.INSIGHT_MONTHLY_ALERT_USD || '0');
  if (!limit || totalMonthly < limit) return;

  const webhook = process.env.INSIGHT_ALERT_WEBHOOK;
  const payload = {
    source: 'insight',
    message: `Monthly Insight cost exceeded threshold: $${totalMonthly.toFixed(2)} (limit $${limit.toFixed(2)})`,
    totalMonthly,
    limit,
    timestamp: new Date().toISOString(),
  };

  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      logger.warn('INSIGHT ALERT WEBHOOK FAILED', e);
    }
  } else {
    logger.warn('INSIGHT ALERT', payload);
  }
}

/**
 * Guest full-chat transcript (no DB). Omits empty trailing assistant placeholders.
 */
function normalizeGuestConversation(messages: unknown, fallbackUserInput: string) {
  if (Array.isArray(messages) && messages.length > 0) {
    return messages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant'))
      .filter((m: any) => !(m.role === 'assistant' && !String(m.content ?? '').trim()))
      .map((m: any) => ({
        role: m.role as string,
        content: String(m.content ?? ''),
      }));
  }
  return [{ role: 'user', content: fallbackUserInput.trim() }];
}

export async function handleAnonymousInsightChat(req: NextRequest, body: any): Promise<Response> {
  let admin;
  try {
    admin = getServiceRoleSupabase();
  } catch (e) {
    logger.error('Anonymous Insight: service role unavailable', e);
    return new Response(JSON.stringify({ error: 'Configurare server incompletă.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { anonymousId, isNewAnonymousId } = resolveAnonymousIdentity(req);
  const setCookieHeader = isNewAnonymousId ? buildAnonymousInsightCookieHeader(anonymousId) : null;

  const { sessionId: _sid, input, messages, maxOutputTokens, persona, contextMessages, mode } = body || {};
  const requestSource =
    typeof (body as Record<string, unknown>)?.source === 'string'
      ? String((body as Record<string, unknown>).source).trim()
      : '';

  const anonAttachmentPaths = Array.isArray((body as Record<string, unknown>)?.attachmentPaths)
    ? ((body as Record<string, unknown>).attachmentPaths as unknown[]).filter(
        (x): x is string => typeof x === 'string' && x.trim().length > 0
      )
    : [];

  if (anonAttachmentPaths.length > 0) {
    return new Response(
      JSON.stringify({
        error: 'Imaginile în Insight sunt disponibile doar cu cont. Creează un cont pentru a atașa poze.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const isIdeRequest = persona === 'ide';
  const isProblemTutor = persona === 'problem_tutor';
  // Main chat + problem_tutor: DeepSeek text pipeline (anon cannot attach images).
  const useDeepSeekTextPipeline =
    (requestSource === 'main_chat' || isProblemTutor) && !isIdeRequest;
  const useRaptorFreeTierLimits = shouldUseRaptorFreeTierLimits(persona);
  const interactiveTutor = Boolean((body as Record<string, unknown>)?.interactiveTutor);
  const problemSubject = resolveProblemTutorSubject(
    (body as Record<string, unknown>)?.problemSubject
  );

  let userInput: string;
  if (Array.isArray(messages) && messages.length > 0) {
    const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop();
    if (!lastUserMsg) {
      return new Response(JSON.stringify({ error: 'Mesaje lipsă.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    userInput = lastUserMsg.content;
  } else if (typeof input === 'string' && input.trim()) {
    userInput = input.trim();
  } else {
    return new Response(JSON.stringify({ error: 'Mesajul utilizatorului este necesar.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawProblemImageUrl =
    typeof (body as Record<string, unknown>)?.problemImageUrl === 'string'
      ? String((body as Record<string, unknown>).problemImageUrl).trim().replace(/^@/, '')
      : '';
  const problemImageUrl = isSafePublicProblemImageUrl(rawProblemImageUrl)
    ? rawProblemImageUrl
    : '';

  const originalUserInput = userInput;
  if (
    useDeepSeekTextPipeline &&
    problemImageUrl &&
    !shouldSkipProblemFigureOcr(userInput)
  ) {
    try {
      const [figureOcr] = await extractInsightImageTexts([problemImageUrl], { detail: 'low' });
      if (figureOcr?.trim()) {
        userInput = appendProblemFigureOcr(userInput, figureOcr);
      }
    } catch (figureOcrErr: unknown) {
      // Soft-fail: still answer from the text statement if figure OCR fails.
      logger.error('Insight anonymous problem figure OCR error:', figureOcrErr);
    }
  }

  const modelToUseParam = resolveInsightModel(body?.model);
  const isIdeFastModel = isInsightIdeFastModel(modelToUseParam);

  if (modelToUseParam === 'deep-thinking') {
    return new Response(
      JSON.stringify({
        error:
          'Modelul Planck gânditor este disponibil doar în planul Plus. Creează un cont și fă upgrade pentru a-l folosi.',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let history: Array<{ role: string; content: string }> = [];
  if (isIdeRequest && Array.isArray(messages) && messages.length > 0) {
    history = normalizeIdeConversation(messages, userInput);
  } else if (!isIdeRequest) {
    history = normalizeGuestConversation(messages, userInput);
  }

  const personaKey = typeof persona === 'string' ? persona : null;
  let systemContent =
    'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- OBLIGATORIU: Orice formulă matematică, variabilă (ex: $x$, $y$), ecuație sau număr cu unitate de măsură trebuie scris între dolari ($...$ pentru inline, $$...$$ pentru block). NU scrie niciodată expresii matematice ca text simplu (ex: nu scrie "t_1 = 0,5", scrie "$t_1 = 0,5$").\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.';

  if (personaKey === 'ide') {
    systemContent = buildIdeAgentSystemPrompt(mode, modelToUseParam);
  }

  const systemMessage = {
    role: 'system' as const,
    content: systemContent,
  };

  if (personaKey === 'problem_tutor') {
    systemMessage.content = buildProblemTutorSystemPrompt({
      subject: problemSubject,
      interactiveTutor,
    });
  }

  if (personaKey === 'lesson_tutor') {
    systemMessage.content = buildLessonTutorSystemPrompt();
  }

  const sanitizedContextMessages = Array.isArray(contextMessages)
    ? contextMessages
        .filter(
          (msg: any) =>
            msg &&
            typeof msg === 'object' &&
            (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') &&
            typeof msg.content === 'string' &&
            msg.content.trim().length > 0
        )
        .map((msg: any) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content as string,
        }))
    : [];

  const historyMessages = (history || []).map((m) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));

  const lastHistoryMessage =
    historyMessages.length > 0 ? historyMessages[historyMessages.length - 1] : null;
  const isLastMessageCurrentUser =
    lastHistoryMessage?.role === 'user' &&
    (lastHistoryMessage.content === userInput ||
      lastHistoryMessage.content === originalUserInput);

  if (
    isLastMessageCurrentUser &&
    lastHistoryMessage &&
    lastHistoryMessage.content !== userInput
  ) {
    historyMessages[historyMessages.length - 1] = {
      ...lastHistoryMessage,
      content: userInput,
    };
  }

  const chatMessages = [
    systemMessage,
    ...toChatCompletionsMessages(sanitizedContextMessages),
    ...toChatCompletionsMessages(historyMessages),
    ...(isLastMessageCurrentUser ? [] : [{ role: 'user' as const, content: userInput }]),
  ];

  const hasUserMessage = chatMessages.some((m) => m.role === 'user');
  if (!hasUserMessage) {
    return new Response(JSON.stringify({ error: 'Mesajul utilizatorului lipsește.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const activeModel = isIdeRequest
    ? resolveIdeAgentModel(modelToUseParam)
    : useDeepSeekTextPipeline
      ? isProblemTutor
        ? getIdeAgentFlashModel()
        : resolveIdeAgentModel(modelToUseParam)
      : (modelToUseParam as 'gpt-4o' | 'gpt-4o-mini');

  const maxTokensParam = {
    max_tokens: typeof maxOutputTokens === 'number' ? maxOutputTokens : 3000,
  };

  const usageReserve = await reserveAnonymousInsightUsage(
    admin,
    anonymousId,
    useRaptorFreeTierLimits,
    isIdeFastModel
  );

  if (!usageReserve.ok) {
    if ('limitExceeded' in usageReserve && usageReserve.limitExceeded) {
      return createAnonymousLimitExceededStream(req, setCookieHeader, {
        persona: typeof persona === 'string' ? persona : null,
        mode,
        resetTime: useRaptorFreeTierLimits && !isIdeFastModel ? undefined : nextUtcMidnightIso(),
      });
    }

    if ('status' in usageReserve && 'body' in usageReserve) {
      return new Response(JSON.stringify(usageReserve.body), {
        status: usageReserve.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const t0 = Date.now();
  let stream: AsyncIterable<any>;
  try {
    const useDeepSeekClient = isIdeRequest || useDeepSeekTextPipeline;
    const openai = useDeepSeekClient ? getIdeAgentClient() : getOpenAIClient();
    stream = await openai.chat.completions.create({
      model: activeModel,
      messages: chatMessages,
      stream: true,
      ...maxTokensParam,
      ...(personaKey === 'problem_tutor'
        ? { temperature: INSIGHT_PROBLEM_TUTOR_TEMPERATURE }
        : {}),
      ...(useDeepSeekClient
        ? deepseekThinkingExtra({
            enabled: shouldEnableDeepseekThinking({
              useDeepSeekClient: true,
              isProblemTutor,
              model: modelToUseParam,
            }),
          })
        : {}),
    } as OpenAI.Chat.ChatCompletionCreateParamsStreaming);
  } catch (openaiError: any) {
    if (openaiError?.status === 429) {
      const errorCode = openaiError?.code || '';
      if (errorCode === 'insufficient_quota') {
        return new Response(
          JSON.stringify({ error: 'Contul OpenAI nu are suficiente credite. Verifică billing-ul.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ error: 'Prea multe cereri. Te rugăm să încerci mai târziu.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (openaiError instanceof Error && openaiError.message.includes('Missing credentials')) {
      return new Response(JSON.stringify({ error: 'Configurare API invalidă. Contactează administratorul.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw openaiError;
  }

  const encoder = new TextEncoder();
  let fullText = '';
  let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null =
    null;

  const abortSignal = req.signal;
  let clientAborted = abortSignal?.aborted ?? false;
  const markAborted = () => {
    clientAborted = true;
  };
  abortSignal?.addEventListener('abort', markAborted);

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (clientAborted) {
            if (typeof (stream as any).return === 'function') {
              try {
                await (stream as any).return();
              } catch (returnErr) {
                logger.warn('Error while returning stream after abort:', returnErr);
              }
            }
            break;
          }

          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content })}\n\n`)
            );
          }

          if (chunk.usage) {
            usage = chunk.usage;
          }
        }

        const inputTokens = usage?.prompt_tokens ?? 0;
        const outputTokens = usage?.completion_tokens ?? 0;
        const totalTokens = usage?.total_tokens ?? 0;
        const latencyMs = Date.now() - t0;

        const costUSD = estimateCostUSD(inputTokens, outputTokens, {
          ideAgent: isIdeRequest || useDeepSeekTextPipeline,
        });

        await admin.from('insight_logs').insert({
          user_id: null,
          anonymous_id: anonymousId,
          latency_ms: latencyMs,
          input_tokens: inputTokens || null,
          output_tokens: outputTokens || null,
          total_tokens: totalTokens || null,
          cost_usd: costUSD || null,
        });

        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        const { data: monthlyLogs } = await admin
          .from('insight_logs')
          .select('cost_usd')
          .eq('anonymous_id', anonymousId)
          .gte('created_at', startOfMonth.toISOString());

        const monthlyTotal = (monthlyLogs || []).reduce(
          (sum, row: any) => sum + Number(row.cost_usd || 0),
          0
        );

        await postAlertIfNeeded(monthlyTotal);

        if (!clientAborted) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                sessionId: null,
                metrics: {
                  latencyMs,
                  inputTokens,
                  outputTokens,
                  totalTokens,
                  costUSD,
                  monthlyTotal,
                },
              })}\n\n`
            )
          );
        }

        controller.close();
      } catch (streamError: any) {
        if (clientAborted) {
          controller.close();
          return;
        }
        logger.error('Anonymous stream processing error:', streamError);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: 'Eroare la procesarea răspunsului.' })}\n\n`
          )
        );
        controller.close();
      } finally {
        abortSignal?.removeEventListener('abort', markAborted);
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
