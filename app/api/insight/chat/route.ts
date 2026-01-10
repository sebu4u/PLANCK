import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';
import { estimateCostUSD } from '@/lib/insight-cost';
import { logger } from '@/lib/logger';
import { resolvePlanForRequest, parseAccessToken } from '@/lib/subscription-plan-server';
import type { SubscriptionPlan } from '@/lib/subscription-plan';

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

// Maximum prompts per day for Free plan (Raptor1 Fast)
const FREE_DAILY_LIMIT = 20;
// Maximum prompts per month for Free plan (Raptor1)
const FREE_RAPTOR1_MONTHLY_LIMIT = 10;
// Maximum prompts per month for Plus plan (combined Insight + AI Agent)
const PLUS_MONTHLY_LIMIT = 800;

/**
 * Converts messages to OpenAI Chat Completions format
 */
function toChatCompletionsMessages(
  messages: Array<{ role: string; content: string }>
) {
  return messages.map((m) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));
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
  try {
    // Extract Bearer token
    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i);
    if (!tokenMatch) {
      return NextResponse.json({ error: 'Necesită autentificare.' }, { status: 401 });
    }
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
    const isFreePlan = userPlan === 'free';
    const isPlusPlan = userPlan === 'plus';

    // Parse request body - support both old format (messages array) and new format (sessionId + input)
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      logger.error('Failed to parse request body as JSON:', jsonError);
      return NextResponse.json(
        { error: 'Formatul cererii este invalid. Verifică JSON-ul trimis.' },
        { status: 400 }
      );
    }
    const { sessionId, input, messages, maxOutputTokens, persona, contextMessages, mode } = body || {};

    // Check if this is from IDE - IDE messages should not be saved to chat history
    const isIdeRequest = persona === 'ide';

    // Support legacy format (messages array) for backward compatibility
    let userInput: string;
    let resolvedSessionId: string | undefined = sessionId;

    if (Array.isArray(messages) && messages.length > 0) {
      // Legacy format: extract last user message
      const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop();
      if (!lastUserMsg) {
        return NextResponse.json({ error: 'Mesaje lipsă.' }, { status: 400 });
      }
      userInput = lastUserMsg.content;
    } else if (typeof input === 'string' && input.trim()) {
      // New format: sessionId + input
      userInput = input.trim();
    } else {
      return NextResponse.json({ error: 'Mesajul utilizatorului este necesar.' }, { status: 400 });
    }

    // Determine requested model first to apply correct limits
    const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'deep-thinking'];
    const requestedModel = body?.model;
    const modelToUseParam = allowedModels.includes(requestedModel) ? requestedModel : 'gpt-4o-mini';

    // Check usage limits based on plan
    if (isFreePlan) {
      // Block Deep Thinking (Raptor1 heavy) for Free plan
      if (modelToUseParam === 'deep-thinking') {
        return NextResponse.json(
          { error: 'Modelul Raptor1 heavy este disponibil doar în planul Plus. Fă upgrade pentru a-l folosi.' },
          { status: 403 }
        );
      }

      if (modelToUseParam === 'gpt-4o') {
        // Free plan + Raptor1 (gpt-4o): Monthly limit check (10/month)
        const now = new Date();
        const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const monthKey = currentMonth.toISOString().split('T')[0]; // YYYY-MM-01

        const { data: monthlyUsageRow } = await supabase
          .from('ai_monthly_usage')
          .select('prompts_count')
          .eq('user_id', user.id)
          .eq('usage_month', monthKey)
          .maybeSingle();

        const currentMonthlyCount = monthlyUsageRow?.prompts_count ?? 0;
        if (currentMonthlyCount >= FREE_RAPTOR1_MONTHLY_LIMIT) {
          return NextResponse.json(
            { error: 'Ai atins limita lunară pentru Raptor1 (10 solicitări/lună) pe planul Free. Treci la Raptor1 fast sau fă upgrade.' },
            { status: 429 }
          );
        }
      } else {
        // Free plan + Raptor1 fast (gpt-4o-mini): Daily limit check (20/day)
        const usageDate = new Date().toISOString().split('T')[0]; // UTC date YYYY-MM-DD
        const { data: usageRow } = await supabase
          .from('insight_usage')
          .select('prompts_count')
          .eq('user_id', user.id)
          .eq('usage_date', usageDate)
          .maybeSingle();

        const currentCount = usageRow?.prompts_count ?? 0;
        if (currentCount >= FREE_DAILY_LIMIT) {
          const now = new Date();
          const nextReset = new Date(now);
          nextReset.setUTCHours(24, 0, 0, 0); // Next midnight UTC

          return NextResponse.json(
            {
              error: 'Ai atins limita zilnică pentru Raptor1 fast (20 solicitări/zi).',
              resetTime: nextReset.toISOString()
            },
            { status: 429 }
          );
        }
      }
    } else if (isPlusPlan) {
      // Plus plan: monthly limit check (800 prompts/month combined for Insight + AI Agent)
      // All models draw from the same bucket
      const now = new Date();
      const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const monthKey = currentMonth.toISOString().split('T')[0]; // YYYY-MM-01

      const { data: monthlyUsageRow } = await supabase
        .from('ai_monthly_usage')
        .select('prompts_count')
        .eq('user_id', user.id)
        .eq('usage_month', monthKey)
        .maybeSingle();

      const currentMonthlyCount = monthlyUsageRow?.prompts_count ?? 0;
      if (currentMonthlyCount >= PLUS_MONTHLY_LIMIT) {
        return NextResponse.json(
          { error: `Ai atins limita lunară pentru planul Plus (800 solicitări/lună pentru Insight și AI Agent).` },
          { status: 429 }
        );
      }
    }
    // Premium plan: no limits (for now, can be extended later)

    // Handle session: create if needed, validate ownership if exists
    // Skip session handling for IDE requests as they don't need persistent history
    if (!isIdeRequest) {
      if (!resolvedSessionId) {
        // Create new session with auto-generated title from first message
        const autoTitle = userInput.slice(0, 60);
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

      // Save user message to database (only for non-IDE requests)
      const { error: insUserMsgErr } = await supabase
        .from('insight_chat_messages')
        .insert({
          session_id: resolvedSessionId,
          user_id: user.id,
          role: 'user',
          content: userInput,
        });

      if (insUserMsgErr) {
        logger.error('Failed to save user message:', insUserMsgErr);
        return NextResponse.json({ error: 'Nu am putut salva mesajul.' }, { status: 500 });
      }
    }

    // Load message history from database for context (last 30 messages)
    // For IDE requests, skip loading history as they maintain their own local state
    let history: Array<{ role: string; content: string }> = [];
    if (!isIdeRequest && resolvedSessionId) {
      const { data: historyData, error: historyErr } = await supabase
        .from('insight_chat_messages')
        .select('role, content')
        .eq('session_id', resolvedSessionId)
        .order('created_at', { ascending: true })
        .limit(30);

      if (historyErr) {
        logger.error('Failed to load history:', historyErr);
        return NextResponse.json({ error: 'Nu am putut încărca istoricul.' }, { status: 500 });
      }

      history = historyData || [];
    }

    // Build messages array for OpenAI (include system message + history)
    const personaKey = typeof persona === 'string' ? persona : null;
    let systemContent =
      'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- OBLIGATORIU: Orice formulă matematică, variabilă (ex: $x$, $y$), ecuație sau număr cu unitate de măsură trebuie scris între dolari ($...$ pentru inline, $$...$$ pentru block). NU scrie niciodată expresii matematice ca text simplu (ex: nu scrie "t_1 = 0,5", scrie "$t_1 = 0,5$").\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.';

    if (personaKey === 'ide') {
      systemContent =
        'Ești Insight, co-pilotul din PlanckCode IDE. Ajută utilizatorii să scrie, să explici și să refactorizezi cod (în special C++), să depanezi erori și să oferi exemple practice. Menține răspunsurile concentrate pe programare și algoritmică; dacă utilizatorul cere altceva, redirecționează-l respectuos către subiecte tehnice.\n\nIMPORTANT - Cum răspunzi:\n1. Dacă utilizatorul îți cere în mod clar să **aplici/actualizezi/înlocuiești/rezolvi** codul din editor (ex: „corectează în IDE", „repară programul", „rescrie fișierul"), răspunde EXCLUSIV cu un obiect JSON valid, fără text suplimentar înainte sau după. Structura obligatorie este:\n{\n  "type": "code_edit",\n  "target": { "file_name": "<nume_fisier>" },\n  "explanation": "<scurtă explicație a modificărilor>",\n  "full_content": "<TOT codul final, complet, folosind \\n pentru linii noi>",\n  "changes": []\n}\n\nREGULI PENTRU JSON:\n- Include întotdeauna în `full_content` varianta completă și corectă a întregului fișier (inclusiv linii nemodificate).\n- `changes` poate rămâne gol sau poate sumariza modificările (nu trimite patch-uri linie cu linie).\n- Nu adăuga explicații în afara câmpului `explanation`.\n- Dacă nu ești sigur că utilizatorul dorește aplicarea automată, întreabă-l sau furnizează codul în chat, nu trimite JSON.\n\n2. Dacă utilizatorul solicită doar explicații, exemple, sugestii sau nu menționează clar că vrea modificări directe în editor, răspunde în text normal (Markdown) și oferă codul în blocuri ` ```limbaj ... ``` `. Aceste blocuri vor putea fi inserate manual din interfață.\n\nDacă utilizatorul cere explicit să NU modifici editorul, respectă cererea și răspunde doar cu explicații/cod în chat.';

      // Adaugă instrucțiuni extra pentru modul Agent
      if (mode === 'agent') {
        systemContent += '\n\nINSTRUCȚIUNI SPECIALE PENTRU MODUL AGENT (când generezi cod direct în IDE - fie în JSON code_edit, fie în blocuri de cod Markdown):\n- Folosește DOAR următoarele biblioteci standard C++: <iostream>, <fstream>, <algorithm>, <cmath>, <cstring>. NU folosi alte biblioteci sau header-e (ex: <vector>, <string>, <map>, etc.).\n- NU adăuga comentarii în codul generat (nici inline cu //, nici pe blocuri cu /* */). Codul trebuie să fie complet curat, fără nicio formă de comentarii.\n- NU folosi cout sau orice alt mesaj înainte de cin. Când utilizatorul trebuie să introducă date, folosește direct cin fără mesaje prompt (ex: NU scrie "cout << \"Introdu un numar: \";" înainte de "cin >> numar;", ci doar "cin >> numar;").\n- Aceste restricții se aplică la orice cod generat care va fi inserat în IDE (în câmpul full_content din JSON sau în blocuri de cod Markdown).';
      }
    }

    const systemMessage = {
      role: 'system' as const,
      content: systemContent,
    };

    if (personaKey === 'problem_tutor') {
      const problemTutorContent = `Ești Insight, un profesor de fizică răbdător și pedagog. Scopul tău este să ghicești studentul să rezolve singur problema, NU să îi dai rezolvarea directă.

REGULI DE INTERACȚIUNE:
1. NU rezolva problema numeric din prima.
2. Explică fenomenele fizice implicate și principiile teoretice.
3. Întreabă studentul ce pași crede că ar trebui urmați.
4. Dacă studentul se blochează, dă-i un indiciu mic, nu tot pasul.
5. OBLIGATORIU: Orice formulă matematică, variabilă (ex: $x$, $y$), ecuație sau număr cu unitate de măsură trebuie scris între dolari ($...$ pentru inline, $$...$$ pentru block). NU scrie niciodată expresii matematice ca text simplu.

EXCEPTIE - SOLUȚIA COMPLETĂ:
Dacă utilizatorul cere explicit "Vreau să văd soluția completă" sau ceva similar:
1. Oferă rezolvarea completă, pas cu pas, cu calcule numerice.
2. NU mai genera întrebări de ghidaj.
3. NU mai genera blocul ---SUGGESTIONS--- la final.

GENERARE ÎNTREBĂRI SUGERATE:
La finalul FIECARUI răspuns (EXCEPTÂND când oferi soluția completă), generează OBLIGATORIU un bloc special cu 2-3 întrebări scurte pe care studentul ți le-ar putea adresa în continuare.
Aceste întrebări trebuie să fie pertinente pentru stadiul curent al discuției și să ajute studentul să avanseze.

Formatul TREBUIE să fie exact acesta la finalul mesajului, PRECEDAT DOAR DE LINII GOALE (fără alte texte înainte sau după acest bloc în zona de sugestii) și FĂRĂ markdown (nu pune în \`\`\`json ... \`\`\`):

---SUGGESTIONS---
["Întrebare scurtă 1?", "Întrebare scurtă 2?", "Ce fac mai departe?"]

Exemplu de întrebări: "Cum calculez forța?", "Ce formulă folosesc?", "E corect raționamentul?", "Care e următorul pas?".
Asigură-te că JSON-ul este valid.`;

      // Override system message
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

    // Check if the last message in history is the current user message
    // (it might be included if the database query happened after the insert)
    const lastHistoryMessage = historyMessages.length > 0 ? historyMessages[historyMessages.length - 1] : null;
    const isLastMessageCurrentUser = lastHistoryMessage?.role === 'user' && lastHistoryMessage?.content === userInput;

    // Prepare messages for OpenAI Chat Completions API
    // Note: history may not include the just-inserted user message due to timing,
    // so we explicitly add the current user input as the last message if it's not already there
    const chatMessages = [
      systemMessage,
      ...toChatCompletionsMessages(sanitizedContextMessages),
      ...toChatCompletionsMessages(historyMessages),
      // Explicitly add current user message only if it's not already in history
      ...(isLastMessageCurrentUser ? [] : [{
        role: 'user' as const,
        content: userInput,
      }]),
    ];

    // Validate that messages array is not empty and has at least one user message
    if (!chatMessages || chatMessages.length === 0) {
      logger.error('Empty chatMessages array');
      return NextResponse.json(
        { error: 'Nu am putut pregăti mesajele pentru chat.' },
        { status: 500 }
      );
    }

    const hasUserMessage = chatMessages.some((m) => m.role === 'user');
    if (!hasUserMessage) {
      logger.error('No user message in chatMessages array');
      return NextResponse.json(
        { error: 'Mesajul utilizatorului lipsește.' },
        { status: 400 }
      );
    }

    // activeModel was determined earlier for logic check:
    const activeModel = modelToUseParam === 'deep-thinking' ? 'gpt-4o' : modelToUseParam;

    // For "deep-thinking" mode, inject Chain of Thought instructions
    if (modelToUseParam === 'deep-thinking') {
      systemContent += '\n\nMOD "DEEP THINKING" ACTIVAT:\nTe rog să gândești pas cu pas înainte de a răspunde. Analizează problema în profunzime, verifică ipotezele și planifică rezolvarea înainte de a genera codul final. Explică raționamentul tău logic.';
      // Update system message content
      systemMessage.content = systemContent;
    }

    // Prepare parameters for OpenAI (standard models only, o1 removed)
    const maxTokensParam = {
      max_tokens: typeof maxOutputTokens === 'number' ? maxOutputTokens : 3000,
    };

    let finalMessages = chatMessages;

    // Call OpenAI Chat Completions API with streaming
    const t0 = Date.now();
    let stream: any;
    try {
      const openai = getOpenAIClient();

      const completionParams: any = {
        model: activeModel,
        messages: finalMessages,
        stream: true,
        ...maxTokensParam,
      };

      stream = await openai.chat.completions.create(completionParams);
    } catch (openaiError: any) {
      // Handle specific OpenAI errors - don't increment counter on failure
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

          // Save assistant message to database (only for non-IDE requests)
          if (!isIdeRequest && resolvedSessionId) {
            const { error: insAsstMsgErr } = await supabase
              .from('insight_chat_messages')
              .insert({
                session_id: resolvedSessionId,
                user_id: user.id,
                role: 'assistant',
                content: fullText || 'Nu am primit răspuns.',
                input_tokens: inputTokens || null,
                output_tokens: outputTokens || null,
              });

            if (insAsstMsgErr) {
              logger.error('Failed to save assistant message:', insAsstMsgErr);
            }
          }

          if (!clientAborted) {
            // Only increment counter after successful OpenAI call
            // Use appropriate tracking based on plan
            if (isFreePlan) {
              if (modelToUseParam === 'gpt-4o') {
                // Raptor1 (gpt-4o) on Free plan: increment monthly usage
                const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
                  'ai_check_and_increment_monthly',
                  {
                    p_user_id: user.id,
                    p_monthly_limit: FREE_RAPTOR1_MONTHLY_LIMIT,
                  }
                );

                if (rpcErr) {
                  logger.error('RPC error after OpenAI success (Raptor1 monthly)', rpcErr);
                } else if (!incrementAllowed) {
                  logger.warn('Monthly counter increment failed for Raptor1 after success');
                }
              } else {
                // Raptor1 fast (gpt-4o-mini): increment daily usage
                const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
                  'insight_check_and_increment',
                  {
                    p_user_id: user.id,
                    p_daily_limit: FREE_DAILY_LIMIT,
                  }
                );

                if (rpcErr) {
                  logger.error('RPC error after OpenAI success', rpcErr);
                } else if (!incrementAllowed) {
                  logger.warn('Counter increment failed after OpenAI success - race condition?');
                }
              }
            } else if (isPlusPlan) {
              // Plus plan: increment monthly usage (combined for Insight + AI Agent)
              const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
                'ai_check_and_increment_monthly',
                {
                  p_user_id: user.id,
                  p_monthly_limit: PLUS_MONTHLY_LIMIT,
                }
              );

              if (rpcErr) {
                logger.error('RPC error after OpenAI success (monthly)', rpcErr);
              } else if (!incrementAllowed) {
                logger.warn('Monthly counter increment failed after OpenAI success - race condition?');
              }
            }
            // Premium plan: no tracking needed (unlimited)
          }

          // Calculate cost
          const costUSD = estimateCostUSD(inputTokens, outputTokens);

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

