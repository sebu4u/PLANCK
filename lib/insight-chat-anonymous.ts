import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { estimateCostUSD } from '@/lib/insight-cost';
import {
  FREE_DAILY_LIMIT,
  FREE_RAPTOR1_MONTHLY_LIMIT,
  isInsightIdeFastModel,
  resolveInsightModel,
  shouldUseRaptorFreeTierLimits,
} from '@/lib/insight-limits';
import { logger } from '@/lib/logger';
import {
  buildAnonymousInsightCookieHeader,
  nextUtcMidnightIso,
  resolveAnonymousIdentity,
} from '@/lib/anonymous-insight';
import { getServiceRoleSupabase } from '@/lib/supabaseServiceRole';
import { createAnonymousLimitExceededStream } from '@/lib/anonymous-limit-fake-stream';

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
  const useRaptorFreeTierLimits = shouldUseRaptorFreeTierLimits(persona);

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

  const modelToUseParam = resolveInsightModel(body?.model);
  const isIdeFastModel = isInsightIdeFastModel(modelToUseParam);

  if (modelToUseParam === 'deep-thinking') {
    return new Response(
      JSON.stringify({
        error:
          'Modelul Raptor1 heavy este disponibil doar în planul Plus. Creează un cont și fă upgrade pentru a-l folosi.',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const usageDate = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = currentMonth.toISOString().split('T')[0];

  if (useRaptorFreeTierLimits) {
    if (!isIdeFastModel) {
      const { data: monthlyUsageRow } = await admin
        .from('anonymous_ai_monthly_usage')
        .select('prompts_count')
        .eq('anonymous_id', anonymousId)
        .eq('usage_month', monthKey)
        .maybeSingle();

      const currentMonthlyCount = monthlyUsageRow?.prompts_count ?? 0;
      if (currentMonthlyCount >= FREE_RAPTOR1_MONTHLY_LIMIT) {
        return createAnonymousLimitExceededStream(req, setCookieHeader, {
          persona: typeof persona === 'string' ? persona : null,
          mode,
        });
      }
    } else {
      const { data: usageRow } = await admin
        .from('anonymous_insight_usage')
        .select('prompts_count')
        .eq('anonymous_id', anonymousId)
        .eq('usage_date', usageDate)
        .maybeSingle();

      const currentCount = usageRow?.prompts_count ?? 0;
      if (currentCount >= FREE_DAILY_LIMIT) {
        return createAnonymousLimitExceededStream(req, setCookieHeader, {
          persona: typeof persona === 'string' ? persona : null,
          mode,
          resetTime: nextUtcMidnightIso(),
        });
      }
    }
  } else {
    const { data: usageRow } = await admin
      .from('anonymous_insight_usage')
      .select('prompts_count')
      .eq('anonymous_id', anonymousId)
      .eq('usage_date', usageDate)
      .maybeSingle();

    const currentCount = usageRow?.prompts_count ?? 0;
    if (currentCount >= FREE_DAILY_LIMIT) {
      return createAnonymousLimitExceededStream(req, setCookieHeader, {
        persona: typeof persona === 'string' ? persona : null,
        mode,
        resetTime: nextUtcMidnightIso(),
      });
    }
  }

  let history: Array<{ role: string; content: string }> = [];
  if (!isIdeRequest) {
    history = normalizeGuestConversation(messages, userInput);
  }

  const personaKey = typeof persona === 'string' ? persona : null;
  let systemContent =
    'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- OBLIGATORIU: Orice formulă matematică, variabilă (ex: $x$, $y$), ecuație sau număr cu unitate de măsură trebuie scris între dolari ($...$ pentru inline, $$...$$ pentru block). NU scrie niciodată expresii matematice ca text simplu (ex: nu scrie "t_1 = 0,5", scrie "$t_1 = 0,5$").\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.';

  if (personaKey === 'ide') {
    systemContent =
      'Ești Insight, co-pilotul din PlanckCode IDE. Ajută utilizatorii să scrie, să explici și să refactorizezi cod (în special C++), să depanezi erori și să oferi exemple practice. Menține răspunsurile concentrate pe programare și algoritmică; dacă utilizatorul cere altceva, redirecționează-l respectuos către subiecte tehnice.\n\nIMPORTANT - Cum răspunzi:\n1. Dacă utilizatorul îți cere în mod clar să **aplici/actualizezi/înlocuiești/rezolvi** codul din editor (ex: „corectează în IDE", „repară programul", „rescrie fișierul"), răspunde EXCLUSIV cu un obiect JSON valid, fără text suplimentar înainte sau după. Structura obligatorie este:\n{\n  "type": "code_edit",\n  "target": { "file_name": "<nume_fisier>" },\n  "explanation": "<scurtă explicație a modificărilor>",\n  "full_content": "<TOT codul final, complet, folosind \\n pentru linii noi>",\n  "changes": []\n}\n\nREGULI PENTRU JSON:\n- Include întotdeauna în `full_content` varianta completă și corectă a întregului fișier (inclusiv linii nemodificate).\n- `changes` poate rămâne gol sau poate sumariza modificările (nu trimite patch-uri linie cu linie).\n- Nu adăuga explicații în afara câmpului `explanation`.\n- Dacă nu ești sigur că utilizatorul dorește aplicarea automată, întreabă-l sau furnizează codul în chat, nu trimite JSON.\n\n2. Dacă utilizatorul solicită doar explicații, exemple, sugestii sau nu menționează clar că vrea modificări directe în editor, răspunde în text normal (Markdown) și oferă codul în blocuri ` ```limbaj ... ``` `. Aceste blocuri vor putea fi inserate manual din interfață.\n\nDacă utilizatorul cere explicit să NU modifici editorul, respectă cererea și răspunde doar cu explicații/cod în chat.';

    if (mode === 'agent') {
      systemContent +=
        '\n\nINSTRUCȚIUNI SPECIALE PENTRU MODUL AGENT (când generezi cod direct în IDE - fie în JSON code_edit, fie în blocuri de cod Markdown):\n- Folosește DOAR următoarele biblioteci standard C++: <iostream>, <fstream>, <algorithm>, <cmath>, <cstring>. NU folosi alte biblioteci sau header-e (ex: <vector>, <string>, <map>, etc.).\n- NU adăuga comentarii în codul generat (nici inline cu //, nici pe blocuri cu /* */). Codul trebuie să fie complet curat, fără nicio formă de comentarii.\n- NU folosi cout sau orice alt mesaj înainte de cin. Când utilizatorul trebuie să introducă date, folosește direct cin fără mesaje prompt (ex: NU scrie "cout << \"Introdu un numar: \";" înainte de "cin >> numar;", ci doar "cin >> numar;").\n- Aceste restricții se aplică la orice cod generat care va fi inserat în IDE (în câmpul full_content din JSON sau în blocuri de cod Markdown).';
    }
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

IMPORTANT: DOAR în acest mod trebuie să generezi la final blocul ---SUGGESTIONS--- cu 2-3 întrebări propuse.

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
- NU genera blocul ---SUGGESTIONS---.

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
- NU genera blocul ---SUGGESTIONS---.

EXCEPTIE - SOLUȚIA COMPLETĂ:
Dacă utilizatorul cere explicit "Vreau să văd soluția completă", "Arată-mi rezolvarea completă" sau ceva similar:
1. Oferă rezolvarea completă, pas cu pas, cu calcule numerice.
2. NU mai genera întrebări de ghidaj.
3. NU mai genera blocul ---SUGGESTIONS--- la final.

GENERARE ÎNTREBĂRI SUGERATE:
Generează blocul ---SUGGESTIONS--- doar în MODUL GHIDARE SOCRATICĂ.
În toate celelalte cazuri, NU genera acest bloc.
Întrebările trebuie să fie pertinente pentru stadiul curent al discuției și să ajute elevul să avanseze.
IMPORTANT: Dacă generezi acest bloc, nu pune întrebări în zona de sugestii în alt format și nu adăuga text după el.

Formatul TREBUIE să fie exact acesta la finalul mesajului, PRECEDAT DOAR DE LINII GOALE (fără alte texte înainte sau după acest bloc în zona de sugestii) și FĂRĂ markdown (nu pune în \`\`\`json ... \`\`\`):

---SUGGESTIONS---
["Întrebare scurtă 1?", "Întrebare scurtă 2?", "Ce fac mai departe?"]

Exemplu de întrebări: "Cum calculez forța?", "Ce formulă folosesc?", "E corect raționamentul?", "Care e următorul pas?".
Asigură-te că JSON-ul este valid.`;

    systemMessage.content = problemTutorContent;
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
    lastHistoryMessage?.role === 'user' && lastHistoryMessage?.content === userInput;

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

  const activeModel = modelToUseParam as 'gpt-4o' | 'gpt-4o-mini';

  const maxTokensParam = {
    max_tokens: typeof maxOutputTokens === 'number' ? maxOutputTokens : 3000,
  };

  const t0 = Date.now();
  let stream: AsyncIterable<any>;
  try {
    const openai = getOpenAIClient();
    stream = await openai.chat.completions.create({
      model: activeModel,
      messages: chatMessages,
      stream: true,
      ...maxTokensParam,
    });
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

        if (!clientAborted) {
          if (useRaptorFreeTierLimits) {
            if (!isIdeFastModel) {
              const { error: rpcErr } = await admin.rpc('anonymous_ai_check_and_increment_monthly', {
                p_anonymous_id: anonymousId,
                p_monthly_limit: FREE_RAPTOR1_MONTHLY_LIMIT,
              });
              if (rpcErr) {
                logger.error('Anonymous RPC error (Raptor1 monthly)', rpcErr);
              }
            } else {
              const { error: rpcErr } = await admin.rpc('anonymous_insight_check_and_increment', {
                p_anonymous_id: anonymousId,
                p_daily_limit: FREE_DAILY_LIMIT,
              });
              if (rpcErr) {
                logger.error('Anonymous RPC error (daily fast)', rpcErr);
              }
            }
          } else {
            const { error: rpcErr } = await admin.rpc('anonymous_insight_check_and_increment', {
              p_anonymous_id: anonymousId,
              p_daily_limit: FREE_DAILY_LIMIT,
            });
            if (rpcErr) {
              logger.error('Anonymous RPC error (Insight daily)', rpcErr);
            }
          }
        }

        const costUSD = estimateCostUSD(inputTokens, outputTokens);

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
