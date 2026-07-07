export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';
import { estimateCostUSD } from '@/lib/insight-cost';
import {
  INSIGHT_PROBLEM_TUTOR_TEMPERATURE,
  isInsightIdeFastModel,
  resolveInsightModel,
  shouldUseRaptorFreeTierLimits,
} from '@/lib/insight-limits';
import { logger } from '@/lib/logger';
import { resolvePlanForRequest } from '@/lib/subscription-plan-server';
import { reserveAuthenticatedInsightUsage } from '@/lib/insight-usage-reserve';
import { handleAnonymousInsightChat } from '@/lib/insight-chat-anonymous';
import { resolveInsightAgentIntent, userExplicitlyRequestsPlanckResources } from '@/lib/insight/agent/intent-router';
import {
  buildInsightAgentProfileAppendix,
  buildInsightAgentResourceAppendix,
  buildInsightAgentSystemAppendix,
  persistInsightAgentArtifacts,
} from '@/lib/insight/agent/actions';
import {
  buildResourceFoundText,
  getPlanckCatalogRequestPolicy,
  searchPlanckContentCatalog,
} from '@/lib/insight/agent/content-catalog';
import { ensureInsightAgentProfile, loadInsightAgentProfile } from '@/lib/insight/agent/profile';
import {
  buildInsightAttachmentRecords,
  buildInsightUserTextContent,
  createSignedUrlsForInsightPaths,
  validateInsightAttachmentPathsForSession,
  type InsightMessageAttachment,
} from '@/lib/insight-attachments';
import {
  enrichInsightAttachmentsWithOcr,
  enrichInsightAttachmentsWithOcrAndUsage,
  type OcrUsageMetrics,
} from '@/lib/insight-image-ocr';
import {
  buildIdeAgentSystemPrompt,
  getIdeAgentClient,
  normalizeIdeConversation,
  resolveIdeAgentModel,
} from '@/lib/planckcode/ide-agent';

// Lazy initialization of OpenAI client to avoid build-time errors
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.');
  }
  return new OpenAI({
    apiKey,
  });
}

/**
 * Converts messages to OpenAI Chat Completions format
 */
function toChatCompletionsMessages(
  messages: Array<{ role: string; content: string }>
): ChatCompletionMessageParam[] {
  return messages.map((m) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));
}

const MAIN_CHAT_VISION_APPENDIX = `

IMAGINI / PROBLEME DIN FOTOGRAFII:
Utilizatorul poate trimite fotografii cu enunțuri de probleme sau rezolvări scrise de mână. Conținutul imaginilor îți este furnizat ca text transcris (OCR) în mesaj.
1) Rezolvă problema pas cu pas sau verifică rezolvarea, după intenția utilizatorului.
2) Folosește LaTeX în $...$ / $$...$$ pentru formule.
3) Dacă OCR-ul marchează zone ilizibile, menționează ce informații lipsesc.
4) Răspunde util și complet; adaptează stilul (ghidare vs. soluție directă) la cererea utilizatorului.`;

const PROBLEM_TUTOR_VISION_APPENDIX = `

IMAGINI / REZOLVĂRI PE FOAIĂ (SCRIS DE MÂNĂ):
Când mesajul utilizatorului include fotografii cu rezolvări scrise de mână, tratează cererea ca VERIFICARE / CORECTARE:
1) Descrie pe scurt ce observi în imagini (structură, pași, diagrame).
2) Transcrie cât mai fidel pașii și formulele pe care reușești să le citești; folosește obligatoriu LaTeX în $...$ sau $$...$$ pentru orice expresie matematică.
3) Compară raționamentul și rezultatele cu enunțul problemei din context (dacă există) și cu fizica corectă.
4) Listează clar erorile, omisiunile sau ambiguitățile; dacă ceva e ilizibil, spune exact ce zonă nu poți citi și ce ai nevoie (ex. o poză mai clară).
5) Răspunde concis și util; nu forța modul socratic dacă utilizatorul cere verificare. NU genera blocul ---SUGGESTIONS--- pentru acest tip de cerere, decât dacă utilizatorul cere explicit ghidare pas cu pas.`;

type InsightHistoryRow = {
  role: string;
  content: string;
  attachments?: InsightMessageAttachment[] | null;
};

async function openAIUserMessageFromRow(
  supabase: SupabaseClient,
  content: string,
  attachments: InsightMessageAttachment[] | null | undefined
): Promise<ChatCompletionMessageParam> {
  if (!attachments?.length) {
    return { role: 'user', content };
  }
  const urls = await createSignedUrlsForInsightPaths(supabase, attachments);
  const textPart =
    content.trim() ||
    '(Utilizatorul a trimis imagini cu rezolvarea — verifică și corectează ce este scris pe foaie.)';
  const parts: ChatCompletionContentPart[] = [
    { type: 'text', text: textPart },
    ...urls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'high' as const },
    })),
  ];
  return { role: 'user', content: parts };
}

async function insightHistoryToOpenAIMessages(
  supabase: SupabaseClient,
  rows: InsightHistoryRow[]
): Promise<ChatCompletionMessageParam[]> {
  const out: ChatCompletionMessageParam[] = [];
  for (const m of rows) {
    if (m.role === 'user') {
      out.push(await openAIUserMessageFromRow(supabase, m.content, m.attachments));
    } else {
      out.push({ role: m.role as 'assistant' | 'system', content: m.content });
    }
  }
  return out;
}

function threadHasVisionAttachments(rows: InsightHistoryRow[]): boolean {
  return rows.some((r) => r.role === 'user' && Array.isArray(r.attachments) && r.attachments.length > 0);
}

async function insightHistoryToTextMessages(
  supabase: SupabaseClient,
  rows: InsightHistoryRow[]
): Promise<ChatCompletionMessageParam[]> {
  const out: ChatCompletionMessageParam[] = [];
  for (const m of rows) {
    if (m.role === 'user') {
      let attachments = m.attachments;
      if (attachments?.length && attachments.some((a) => !a.ocrText?.trim())) {
        attachments = await enrichInsightAttachmentsWithOcr(supabase, attachments);
      }
      out.push({
        role: 'user',
        content: buildInsightUserTextContent(m.content, attachments),
      });
    } else {
      out.push({ role: m.role as 'assistant' | 'system', content: m.content });
    }
  }
  return out;
}

/**
 * Posts alert if monthly cost exceeds threshold
 */
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

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (jsonError) {
    logger.error('Failed to parse request body as JSON:', jsonError);
    return NextResponse.json(
      { error: 'Formatul cererii este invalid. Verifică JSON-ul trimis.' },
      { status: 400 }
    );
  }

  const authHeader = req.headers.get('authorization') || '';
  const tokenMatch = authHeader.match(/^Bearer (.+)$/i);
  if (!tokenMatch) {
    try {
      return await handleAnonymousInsightChat(req, body);
    } catch (err: unknown) {
      logger.error('Anonymous Insight chat error:', err);
      return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
    }
  }

  try {
    const accessToken = tokenMatch[1];

    // Local JWT expiration check (defensive)
    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ error: 'Sesiune expirată.' }, { status: 401 });
    }

    // Validate token with Supabase
    const supabase = createServerClientWithToken(accessToken);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Sesiune invalidă.' }, { status: 401 });
    }
    const user = userData.user;

    // Get user's plan
    const userPlan = await resolvePlanForRequest(supabase, accessToken);

    const { sessionId, input, messages, maxOutputTokens, persona, contextMessages, mode } = body || {};
    const requestSource =
      typeof (body as Record<string, unknown>).source === 'string'
        ? String((body as Record<string, unknown>).source).trim()
        : '';
    const rawVisibleInput =
      typeof (body as Record<string, unknown>).visibleInput === 'string'
        ? String((body as Record<string, unknown>).visibleInput).trim()
        : '';

    const rawAttachmentPaths = Array.isArray((body as Record<string, unknown>).attachmentPaths)
      ? ((body as Record<string, unknown>).attachmentPaths as unknown[])
          .filter((x): x is string => typeof x === 'string')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // Check if this is from IDE - IDE messages should not be saved to chat history
    const isIdeRequest = persona === 'ide';
    const isMainChatDeepSeek = requestSource === 'main_chat' && !isIdeRequest;
    const personaKey = typeof persona === 'string' ? persona : null;
    const isFocusedTutorPersona = personaKey === 'problem_tutor' || personaKey === 'lesson_tutor';

    if (isIdeRequest && rawAttachmentPaths.length > 0) {
      return NextResponse.json(
        { error: 'Atașarea de imagini nu este disponibilă în IDE.' },
        { status: 400 }
      );
    }
    // Raptor1 free-tier rules (monthly gpt-4o vs daily mini) apply only in PlanckCode IDE.
    // Insight on problem pages, lessons, and /insight/chat uses the general daily Insight limit, not the Raptor1 monthly bucket.
    const useRaptorFreeTierLimits = shouldUseRaptorFreeTierLimits(persona);

    // Support legacy format (messages array) for backward compatibility
    let userInput: string;
    let visibleUserInput: string;
    let resolvedSessionId: string | undefined =
      typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : undefined;

    if (Array.isArray(messages) && messages.length > 0) {
      // Legacy format: extract last user message
      const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop();
      if (!lastUserMsg) {
        return NextResponse.json({ error: 'Mesaje lipsă.' }, { status: 400 });
      }
      userInput = String(lastUserMsg.content ?? '');
      visibleUserInput = userInput;
      if (rawAttachmentPaths.length > 0) {
        return NextResponse.json(
          { error: 'Formatul cu imagini nu este suportat în modul vechi de mesaje.' },
          { status: 400 }
        );
      }
    } else if (typeof input === 'string' && (input.trim() || rawAttachmentPaths.length > 0)) {
      // New format: sessionId + input (input may be empty when only images are sent)
      userInput = input.trim();
      visibleUserInput = rawVisibleInput || userInput;
    } else {
      return NextResponse.json({ error: 'Mesajul utilizatorului este necesar.' }, { status: 400 });
    }

    // Model selection: deep-thinking uses gpt-4o with extra instructions; gpt-4o-mini is IDE "Raptor1 fast" (distinct free-tier bucket from gpt-4o).
    const modelToUseParam = resolveInsightModel(body?.model);
    const isIdeFastModel = isInsightIdeFastModel(modelToUseParam);

    // Block Deep Thinking (Raptor1 heavy) for Free plan
    if (userPlan === 'free' && modelToUseParam === 'deep-thinking') {
      return NextResponse.json(
        { error: 'Modelul Planck gânditor este disponibil doar în planul Plus. Fă upgrade pentru a-l folosi.' },
        { status: 403 }
      );
    }

    let ocrUsage: OcrUsageMetrics | null = null;

    // Handle session: create if needed, validate ownership if exists
    // Skip session handling for IDE requests as they don't need persistent history
    if (!isIdeRequest) {
      if (!resolvedSessionId) {
        // Create new session with auto-generated title from first message
        const autoTitle =
          visibleUserInput.slice(0, 60) || (rawAttachmentPaths.length ? 'Insight — imagini' : 'Insight');
        const { data: newSession, error: sessErr } = await supabase
          .from('insight_chat_sessions')
          .insert({
            user_id: user.id,
            title: autoTitle,
          })
          .select('id')
          .single();

        if (sessErr || !newSession?.id) {
          logger.error('Failed to create session:', sessErr);
          return NextResponse.json({ error: 'Nu am putut crea sesiunea.' }, { status: 500 });
        }
        resolvedSessionId = newSession.id;
      } else {
        // Validate session ownership
        const { data: session, error: sessErr } = await supabase
          .from('insight_chat_sessions')
          .select('id')
          .eq('id', resolvedSessionId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (sessErr || !session) {
          return NextResponse.json({ error: 'Sesiune inexistentă sau inaccesibilă.' }, { status: 404 });
        }
      }

      let attachmentsPayload: InsightMessageAttachment[] | null = null;
      if (rawAttachmentPaths.length > 0) {
        const sid = resolvedSessionId;
        if (!sid) {
          return NextResponse.json({ error: 'Sesiune invalidă pentru atașamente.' }, { status: 500 });
        }
        if (!validateInsightAttachmentPathsForSession(rawAttachmentPaths, user.id, sid)) {
          return NextResponse.json(
            { error: 'Căile atașamentelor sunt invalide sau nu aparțin sesiunii curente.' },
            { status: 400 }
          );
        }
        attachmentsPayload = buildInsightAttachmentRecords(rawAttachmentPaths);
        if (attachmentsPayload.length !== rawAttachmentPaths.length) {
          return NextResponse.json({ error: 'Atașamentele nu au putut fi validate.' }, { status: 400 });
        }

        if (isMainChatDeepSeek) {
          try {
            const ocrResult = await enrichInsightAttachmentsWithOcrAndUsage(
              supabase,
              attachmentsPayload
            );
            attachmentsPayload = ocrResult.attachments;
            ocrUsage = ocrResult.ocrUsage;
            userInput = buildInsightUserTextContent(visibleUserInput, attachmentsPayload);
          } catch (ocrErr: unknown) {
            logger.error('Insight main chat OCR error:', ocrErr);
            return NextResponse.json(
              {
                error:
                  'Nu am putut citi conținutul imaginilor. Încearcă o poză mai clară sau adaugă text.',
              },
              { status: 502 }
            );
          }
        }

        logger.info('Insight chat: user message with image attachments', {
          count: rawAttachmentPaths.length,
          sessionId: resolvedSessionId,
        });
      }

      // Save user message to database (only for non-IDE requests)
      const { error: insUserMsgErr } = await supabase.from('insight_chat_messages').insert({
        session_id: resolvedSessionId,
        user_id: user.id,
        role: 'user',
        content: visibleUserInput,
        attachments: attachmentsPayload,
      });

      if (insUserMsgErr) {
        logger.error('Failed to save user message:', insUserMsgErr);
        return NextResponse.json({ error: 'Nu am putut salva mesajul.' }, { status: 500 });
      }
    }

    // Load message history: DB for Insight chat, client messages for IDE
    let history: InsightHistoryRow[] = [];
    if (isIdeRequest && Array.isArray(messages) && messages.length > 0) {
      history = normalizeIdeConversation(messages, userInput).map((row) => ({
        role: row.role,
        content: row.content,
        attachments: null,
      }));
    } else if (!isIdeRequest && resolvedSessionId) {
      const { data: historyData, error: historyErr } = await supabase
        .from('insight_chat_messages')
        .select('role, content, attachments')
        .eq('session_id', resolvedSessionId)
        .order('created_at', { ascending: true })
        .limit(30);

      if (historyErr) {
        logger.error('Failed to load history:', historyErr);
        return NextResponse.json({ error: 'Nu am putut încărca istoricul.' }, { status: 500 });
      }

      history = (historyData || []).map((row: any) => ({
        role: row.role,
        content: row.content,
        attachments: Array.isArray(row.attachments)
          ? (row.attachments as InsightMessageAttachment[])
          : null,
      }));
    }

    const intentSource = isFocusedTutorPersona ? visibleUserInput : `${visibleUserInput}\n${userInput}`;
    const insightAgentIntent = resolveInsightAgentIntent(intentSource);
    const shouldUseAgentCatalog =
      !isFocusedTutorPersona || userExplicitlyRequestsPlanckResources(visibleUserInput);
    if (!isIdeRequest) {
      await ensureInsightAgentProfile(supabase, user.id);
    }
    const insightAgentProfile = !isIdeRequest ? await loadInsightAgentProfile(supabase, user.id) : {};
    const catalogPolicy = shouldUseAgentCatalog
      ? getPlanckCatalogRequestPolicy({
          intent: insightAgentIntent,
          userInput: visibleUserInput,
        })
      : {
          directResourceAnswer: false,
          resourceOnlyAnswer: false,
          artifactLimit: 0,
          responseInstruction:
            'NU recomanda alte exerciții, probleme, lecții sau resurse Planck. Răspunde doar despre problema curentă.',
        };
    const insightAgentResources =
      !isIdeRequest && catalogPolicy.artifactLimit > 0
        ? await searchPlanckContentCatalog(supabase, {
            intent: insightAgentIntent,
            userInput,
            requestText: visibleUserInput,
            limit: catalogPolicy.artifactLimit,
          })
        : [];

    if (!isIdeRequest && resolvedSessionId && catalogPolicy.resourceOnlyAnswer && insightAgentResources[0]) {
      const resourcesForAnswer = catalogPolicy.directResourceAnswer
        ? insightAgentResources.slice(0, 1)
        : insightAgentResources;
      const directText = buildResourceFoundText(resourcesForAnswer);
      const agentPersistenceResult = await persistInsightAgentArtifacts(supabase, {
        userId: user.id,
        sessionId: resolvedSessionId,
        userInput: visibleUserInput,
        assistantText: directText,
        intent: insightAgentIntent,
        resources: resourcesForAnswer,
        messageArtifactTitle: null,
      });

      let { error: directSaveErr } = await supabase
        .from('insight_chat_messages')
        .insert({
          session_id: resolvedSessionId,
          user_id: user.id,
          role: 'assistant',
          content: directText,
          input_tokens: null,
          output_tokens: null,
          agent_artifacts: agentPersistenceResult.messageArtifacts,
        });

      if (directSaveErr && (directSaveErr.code === '42703' || /agent_artifacts/i.test(directSaveErr.message ?? ''))) {
        const fallback = await supabase
          .from('insight_chat_messages')
          .insert({
            session_id: resolvedSessionId,
            user_id: user.id,
            role: 'assistant',
            content: directText,
            input_tokens: null,
            output_tokens: null,
          });
        directSaveErr = fallback.error;
      }

      if (directSaveErr) {
        logger.error('Failed to save direct agent assistant message:', directSaveErr);
      }

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'session', sessionId: resolvedSessionId })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', content: directText })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                sessionId: resolvedSessionId,
                metrics: {
                  latencyMs: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
                  costUSD: 0,
                  monthlyTotal: null,
                },
                agentArtifacts: agentPersistenceResult.messageArtifacts,
              })}\n\n`
            )
          );
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Build messages array for OpenAI (include system message + history)
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
      const problemTutorContent = `Ești Insight, un profesor de fizică răbdător, clar și conversațional. Comportă-te ca un profesor util cu care elevul poate vorbi natural, nu ca un bot rigid. Poți fi cald, încurajator și scurt atunci când contextul cere asta.

CONTEXT ACADEMIC:
- Răspunde conform programei de fizică din învățământul preuniversitar românesc (cls. 9-12).
- Folosește terminologia din manualele românești (ex: "tensiune electromotoare", nu "EMF").
- Unitățile de măsură se scriu în română: "metri pe secundă", nu "m/s" în text liber.
- Când o problemă are mai mulți pași, verifică întotdeauna consistența fizică înainte să răspunzi.

REGULĂ GENERALĂ DE STIL:
- Adaptează răspunsul la intenția reală a utilizatorului. Nu forța mereu același flow.
- OBLIGATORIU: Orice formulă matematică, variabilă (ex: $x$, $y$), ecuație sau număr cu unitate de măsură trebuie scris între dolari ($...$ pentru inline, $$...$$ pentru block). NU scrie niciodată expresii matematice ca text simplu.
- Dacă este natural, poți adăuga o scurtă notă de încurajare, dar fără să devii repetitiv sau robotic.

REGULĂ PAGINĂ PROBLEMĂ:
- Utilizatorul lucrează deja la o problemă specifică din Planck. Concentrează-te exclusiv pe această problemă.
- NU recomanda alte exerciții, probleme, lecții, cursuri sau resurse Planck decât dacă utilizatorul cere explicit asta.
- NU încheia răspunsul cu sugestii de tip „poți exersa și cu...”, „îți recomand și...” sau linkuri către alte resurse.
- Explică, ghidează sau verifică doar în contextul problemei curente.

ALEGE MODUL DE RĂSPUNS ÎN FUNCȚIE DE MESAJ:

1. MOD GHIDARE SOCRATICĂ:
Folosește acest mod doar când utilizatorul cere clar ajutor pentru a rezolva problema sau este blocat, de tipul:
- "rezolvă problema"
- "cum fac?"
- "nu înțeleg"
- "care e următorul pas?"
- "dă-mi un indiciu"

În acest mod:
- NU rezolva problema numeric din prima, decât dacă utilizatorul cere explicit soluția completă.
- Explică pe scurt ideea fizică relevantă.
- Ghidează elevul pas cu pas.
- Înainte să oferi o formulă, verifică dacă se aplică exact în contextul problemei (ex: bobină ideală vs. bobină cu rezistență internă).
- Dacă elevul se blochează, dă un indiciu mic sau verifică direcția, nu oferi imediat toată rezolvarea.
- Poți pune întrebări de ghidaj în răspuns dacă ajută conversația.

2. MOD VERIFICARE RAPIDĂ:
Folosește acest mod când utilizatorul vrea doar să verifice un rezultat, un pas sau o sub-concluzie, de tipul:
- "am obținut $12\\,N$, e corect?"
- "la a) mi-a dat $v = 3\\,m/s$, e bine?"
- "formula asta e bună?"
- "semnul minus aici e corect?"

În acest mod:
- Răspunde direct, scurt și clar.
- Confirmă dacă este corect sau corectează punctual.
- Dacă este util, spune într-o propoziție de ce.
- NU forța flow-ul socratic.

3. MOD RĂSPUNS LIBER / ÎNTREBARE LATERALĂ:
Folosește acest mod când utilizatorul pune o întrebare care nu cere ghidare pas cu pas pe problema curentă, de exemplu:
- cere explicația unui concept sau a unei formule
- întreabă ceva legat de fizică, matematică sau informatică, chiar dacă nu este direct despre problema curentă
- pune o întrebare scurtă auxiliară sau un "off-topic" util pentru învățare

În acest mod:
- Răspunde natural, util și conversațional.
- Dacă întrebarea este despre un concept, oferă o explicație clară și suficientă, fără să o lungești artificial.
- Dacă este relevant, poți menționa la final, într-o singură propoziție naturală, că poți reveni și la problema curentă.
- NU forța întoarcerea la problemă.

EXCEPTIE - SOLUȚIA COMPLETĂ:
Dacă utilizatorul cere explicit "Vreau să văd soluția completă", "Arată-mi rezolvarea completă" sau ceva similar:
1. Oferă rezolvarea completă, pas cu pas, cu calcule numerice.
2. NU mai genera întrebări de ghidaj.
3. NU mai genera blocul ---SUGGESTIONS--- la final.

GENERARE ÎNTREBĂRI SUGERATE:
După fiecare răspuns, generează la final blocul ---SUGGESTIONS--- cu exact 2 întrebări scurte despre problema curentă.
Excepție: NU genera acest bloc doar când oferi soluția completă (EXCEPTIE - SOLUȚIA COMPLETĂ).
Întrebările trebuie să fie pertinente pentru stadiul curent al discuției și să ajute elevul să avanseze pe problema curentă.
IMPORTANT: Dacă generezi acest bloc, nu pune întrebări în zona de sugestii în alt format și nu adăuga text după el.

Formatul TREBUIE să fie exact acesta la finalul mesajului, PRECEDAT DOAR DE LINII GOALE (fără alte texte înainte sau după acest bloc în zona de sugestii) și FĂRĂ markdown (nu pune în \`\`\`json ... \`\`\`):

---SUGGESTIONS---
["Întrebare scurtă 1?", "Întrebare scurtă 2?"]

Exemplu de întrebări: "Cum calculez forța?", "Ce formulă folosesc?", "E corect raționamentul?", "Care e următorul pas?".
Asigură-te că JSON-ul este valid.`;

      // Override system message
      systemMessage.content = problemTutorContent;
      if (threadHasVisionAttachments(history)) {
        systemMessage.content += PROBLEM_TUTOR_VISION_APPENDIX;
      }
    }

    if (!isFocusedTutorPersona) {
      const agentAppendix = buildInsightAgentSystemAppendix(insightAgentIntent);
      if (agentAppendix) {
        systemMessage.content += agentAppendix;
      }
    }
    if (!isIdeRequest && !isFocusedTutorPersona) {
      systemMessage.content += buildInsightAgentProfileAppendix(insightAgentProfile);
      systemMessage.content += buildInsightAgentResourceAppendix(
        insightAgentResources,
        catalogPolicy.responseInstruction
      );
    }

    const hasAnyImagesInContext =
      threadHasVisionAttachments(history) || rawAttachmentPaths.length > 0;

    if (isMainChatDeepSeek && hasAnyImagesInContext) {
      systemMessage.content += MAIN_CHAT_VISION_APPENDIX;
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

    const lastHistoryMessage = history.length > 0 ? history[history.length - 1] : null;
    const isLastMessageCurrentUser =
      lastHistoryMessage?.role === 'user' && lastHistoryMessage?.content === visibleUserInput;

    let finalMessages: ChatCompletionMessageParam[] = [];

    if (isMainChatDeepSeek) {
      const historyForText = isLastMessageCurrentUser
        ? history.map((row, index) =>
            index === history.length - 1
              ? {
                  ...row,
                  content: visibleUserInput,
                }
              : row
          )
        : history;

      let historyText: ChatCompletionMessageParam[] = [];
      let trailingUserText: ChatCompletionMessageParam[] = [];
      try {
        historyText = await insightHistoryToTextMessages(supabase, historyForText);
        if (!isLastMessageCurrentUser) {
          trailingUserText = [
            {
              role: 'user' as const,
              content: userInput,
            },
          ];
        }
      } catch (textErr: unknown) {
        logger.error('Insight main chat text/OCR history error:', textErr);
        return NextResponse.json(
          { error: 'Nu am putut pregăti mesajele pentru chat. Încearcă din nou.' },
          { status: 502 }
        );
      }

      finalMessages = [
        systemMessage,
        ...toChatCompletionsMessages(sanitizedContextMessages),
        ...historyText,
        ...trailingUserText,
      ];
    } else {
      const historyForOpenAI = isLastMessageCurrentUser
        ? history.map((row, index) =>
            index === history.length - 1
              ? {
                  ...row,
                  content: userInput,
                }
              : row
          )
        : history;

      let historyOpenAI: ChatCompletionMessageParam[] = [];
      let trailingUser: ChatCompletionMessageParam[] = [];
      try {
        historyOpenAI = await insightHistoryToOpenAIMessages(supabase, historyForOpenAI);
        if (!isLastMessageCurrentUser) {
          const trailingAttachments =
            rawAttachmentPaths.length > 0 ? buildInsightAttachmentRecords(rawAttachmentPaths) : null;
          trailingUser = [
            await openAIUserMessageFromRow(supabase, userInput, trailingAttachments),
          ];
        }
      } catch (visionErr: unknown) {
        logger.error('Insight vision / signed URL error:', visionErr);
        return NextResponse.json(
          { error: 'Nu am putut pregăti imaginile pentru analiză. Încearcă din nou.' },
          { status: 502 }
        );
      }

      finalMessages = [
        systemMessage,
        ...toChatCompletionsMessages(sanitizedContextMessages),
        ...historyOpenAI,
        ...trailingUser,
      ];
    }

    // Validate that messages array is not empty and has at least one user message
    if (!finalMessages || finalMessages.length === 0) {
      logger.error('Empty finalMessages array');
      return NextResponse.json(
        { error: 'Nu am putut pregăti mesajele pentru chat.' },
        { status: 500 }
      );
    }

    const hasUserMessage = finalMessages.some((m) => m.role === 'user');
    if (!hasUserMessage) {
      logger.error('No user message in finalMessages array');
      return NextResponse.json(
        { error: 'Mesajul utilizatorului lipsește.' },
        { status: 400 }
      );
    }

    let activeModel = isIdeRequest
      ? resolveIdeAgentModel(modelToUseParam)
      : isMainChatDeepSeek
        ? resolveIdeAgentModel(modelToUseParam)
        : modelToUseParam === 'deep-thinking'
          ? 'gpt-4o'
          : modelToUseParam;
    if (hasAnyImagesInContext && !isIdeRequest && !isMainChatDeepSeek) {
      activeModel = 'gpt-4o';
    }

    // For "deep-thinking" mode on non-IDE, non-main-chat personas, inject Chain of Thought instructions
    if (!isIdeRequest && !isMainChatDeepSeek && modelToUseParam === 'deep-thinking') {
      const deepBlock =
        '\n\nMOD "DEEP THINKING" ACTIVAT:\nTe rog să gândești pas cu pas înainte de a răspunde. Analizează problema în profunzime, verifică ipotezele și planifică rezolvarea înainte de a genera codul final. Explică raționamentul tău logic.';
      systemMessage.content += deepBlock;
    }

    // Prepare parameters for OpenAI (standard models only, o1 removed)
    const maxTokensParam = {
      max_tokens: typeof maxOutputTokens === 'number' ? maxOutputTokens : 3000,
    };

    // Atomically reserve quota immediately before OpenAI (prevents race conditions and abort bypass)
    const usageReserve = await reserveAuthenticatedInsightUsage(supabase, {
      plan: userPlan,
      userId: user.id,
      useRaptorFreeTierLimits,
      isIdeFastModel,
    });
    if (!usageReserve.ok) {
      return NextResponse.json(usageReserve.body, { status: usageReserve.status });
    }

    // Call Chat Completions API with streaming (DeepSeek for IDE, OpenAI otherwise)
    const t0 = Date.now();
    let stream: any;
    try {
      const openai =
        isIdeRequest || isMainChatDeepSeek ? getIdeAgentClient() : getOpenAIClient();

      const completionParams: any = {
        model: activeModel,
        messages: finalMessages,
        stream: true,
        ...maxTokensParam,
        ...(personaKey === 'problem_tutor'
          ? { temperature: INSIGHT_PROBLEM_TUTOR_TEMPERATURE }
          : {}),
      };

      stream = await openai.chat.completions.create(completionParams);
    } catch (openaiError: any) {
      // Handle specific OpenAI errors (quota already reserved before the call)
      if (openaiError?.status === 429) {
        const errorCode = openaiError?.code || '';
        if (errorCode === 'insufficient_quota') {
          return NextResponse.json(
            { error: 'Contul OpenAI nu are suficiente credite. Verifică billing-ul.' },
            { status: 503 }
          );
        }
        if (errorCode === 'rate_limit_exceeded') {
          return NextResponse.json(
            { error: 'Prea multe cereri. Te rugăm să încerci mai târziu.' },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: 'Limită de rate atinsă. Te rugăm să încerci mai târziu.' },
          { status: 429 }
        );
      }

      // Handle missing API key error (this is a regular Error, not an OpenAI API error)
      if (openaiError instanceof Error && openaiError.message.includes('Missing credentials')) {
        logger.error('OPENAI_API_KEY is missing or invalid');
        return NextResponse.json(
          { error: 'Configurare API invalidă. Contactează administratorul.' },
          { status: 500 }
        );
      }

      // Handle other OpenAI API errors
      if (openaiError?.status === 401) {
        return NextResponse.json(
          { error: 'Configurare API invalidă. Contactează administratorul.' },
          { status: 500 }
        );
      }

      // Re-throw other errors to be caught by outer catch
      throw openaiError;
    }

    // Create a readable stream to process OpenAI's stream
    const encoder = new TextEncoder();
    let fullText = '';
    let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null;

    const abortSignal = req.signal;
    let clientAborted = abortSignal?.aborted ?? false;

    const markAborted = () => {
      clientAborted = true;
    };

    abortSignal?.addEventListener('abort', markAborted);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          if (!clientAborted && resolvedSessionId) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'session', sessionId: resolvedSessionId })}\n\n`
              )
            );
          }

          for await (const chunk of stream) {
            if (clientAborted) {
              if (typeof stream.return === 'function') {
                try {
                  await stream.return();
                } catch (returnErr) {
                  logger.warn('Error while returning stream after abort:', returnErr);
                }
              }
              break;
            }

            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              // Send text chunk to client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content })}\n\n`)
              );
            }

            // Check for usage info in the final chunk
            if (chunk.usage) {
              usage = chunk.usage;
            }
          }

          // After stream completes, process usage and save to DB
          const inputTokens = usage?.prompt_tokens ?? 0;
          const outputTokens = usage?.completion_tokens ?? 0;
          const totalTokens = usage?.total_tokens ?? 0;
          const latencyMs = Date.now() - t0;

          let agentPersistenceResult: Awaited<ReturnType<typeof persistInsightAgentArtifacts>> | null = null;
          if (!isIdeRequest && !isFocusedTutorPersona && resolvedSessionId && fullText.trim()) {
            try {
              agentPersistenceResult = await persistInsightAgentArtifacts(supabase, {
                userId: user.id,
                sessionId: resolvedSessionId,
                userInput: visibleUserInput,
                assistantText: fullText,
                intent: insightAgentIntent,
                resources: insightAgentResources,
              });
            } catch (agentErr) {
              logger.warn('Insight Agent artifact persistence failed before assistant save:', agentErr);
            }
          }

          // Save assistant message to database (only for non-IDE requests)
          if (!isIdeRequest && resolvedSessionId) {
            let { error: insAsstMsgErr } = await supabase
              .from('insight_chat_messages')
              .insert({
                session_id: resolvedSessionId,
                user_id: user.id,
                role: 'assistant',
                content: fullText || 'Nu am primit răspuns.',
                input_tokens: inputTokens || null,
                output_tokens: outputTokens || null,
                agent_artifacts: agentPersistenceResult?.messageArtifacts ?? [],
              });

            if (insAsstMsgErr && (insAsstMsgErr.code === '42703' || /agent_artifacts/i.test(insAsstMsgErr.message ?? ''))) {
              const fallback = await supabase
                .from('insight_chat_messages')
                .insert({
                  session_id: resolvedSessionId,
                  user_id: user.id,
                  role: 'assistant',
                  content: fullText || 'Nu am primit răspuns.',
                  input_tokens: inputTokens || null,
                  output_tokens: outputTokens || null,
                });
              insAsstMsgErr = fallback.error;
            }

            if (insAsstMsgErr) {
              logger.error('Failed to save assistant message:', insAsstMsgErr);
            }
          }

          // Calculate cost
          const imagesInThread = history.reduce(
            (n, r) =>
              n +
              (r.role === 'user' && Array.isArray(r.attachments) && r.attachments.length > 0
                ? r.attachments.length
                : 0),
            0
          );
          if (imagesInThread > 0) {
            logger.info('Insight chat completed (thread includes images)', {
              imagesInThread,
              inputTokens,
              outputTokens,
            });
          }
          const costUSD =
            estimateCostUSD(inputTokens, outputTokens, {
              insightVisionImagesApprox: isMainChatDeepSeek ? 0 : imagesInThread,
              ideAgent: isIdeRequest || isMainChatDeepSeek,
            }) +
            (ocrUsage
              ? estimateCostUSD(ocrUsage.inputTokens, ocrUsage.outputTokens, {
                  insightVisionImagesApprox: rawAttachmentPaths.length,
                })
              : 0);

          // Log individual request
          await supabase.from('insight_logs').insert({
            user_id: user.id,
            latency_ms: latencyMs,
            input_tokens: inputTokens || null,
            output_tokens: outputTokens || null,
            total_tokens: totalTokens || null,
            cost_usd: costUSD || null,
          });

          // Calculate monthly total and check alert threshold
          const startOfMonth = new Date();
          startOfMonth.setUTCDate(1);
          startOfMonth.setUTCHours(0, 0, 0, 0);

          const { data: monthlyLogs } = await supabase
            .from('insight_logs')
            .select('cost_usd')
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth.toISOString());

          const monthlyTotal = (monthlyLogs || []).reduce(
            (sum, row: any) => sum + Number(row.cost_usd || 0),
            0
          );

          await postAlertIfNeeded(monthlyTotal);

          // Send final metadata
          if (!clientAborted) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'done',
                  sessionId: resolvedSessionId,
                  metrics: {
                    latencyMs,
                    inputTokens,
                    outputTokens,
                    totalTokens,
                    costUSD,
                    monthlyTotal,
                  },
                  agentArtifacts: agentPersistenceResult?.messageArtifacts ?? [],
                })}\n\n`
              )
            )
          }

          controller.close();
        } catch (streamError: any) {
          if (clientAborted) {
            controller.close();
            return;
          }
          logger.error('Stream processing error:', streamError);
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

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    logger.error('Insight API error:', err);
    logger.error('Error details:', {
      message: err?.message,
      status: err?.status,
      code: err?.code,
      stack: err?.stack,
    });

    // Handle missing API key error
    if (err instanceof Error && err.message.includes('Missing credentials')) {
      logger.error('OPENAI_API_KEY is missing or invalid');
      return NextResponse.json(
        { error: 'Configurare API invalidă. Contactează administratorul.' },
        { status: 500 }
      );
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError || (err?.message && err.message.includes('JSON'))) {
      return NextResponse.json(
        { error: 'Formatul cererii este invalid. Verifică JSON-ul trimis.' },
        { status: 400 }
      );
    }

    // Handle OpenAI-specific errors that weren't caught above
    if (err?.status === 429) {
      const errorCode = err?.code || '';
      if (errorCode === 'insufficient_quota') {
        return NextResponse.json(
          { error: 'Contul OpenAI nu are suficiente credite. Verifică billing-ul.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Prea multe cereri. Te rugăm să încerci mai târziu.' },
        { status: 429 }
      );
    }

    // Handle invalid API key from OpenAI
    if (err?.status === 401) {
      return NextResponse.json(
        { error: 'Configurare API invalidă. Contactează administratorul.' },
        { status: 500 }
      );
    }

    // Handle other OpenAI API errors
    if (err?.status && err.status >= 400 && err.status < 500) {
      const errorMessage = err?.message || err?.error?.message || 'Eroare la cererea către OpenAI.';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Generic error - log full error for debugging
    return NextResponse.json(
      {
        error: 'Eroare internă. Încearcă din nou.',
        ...(process.env.NODE_ENV === 'development' && err?.message ? { details: err.message } : {})
      },
      { status: 500 }
    );
  }
}
