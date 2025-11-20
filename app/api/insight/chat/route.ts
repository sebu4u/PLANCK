import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';
import { estimateCostUSD } from '@/lib/insight-cost';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Maximum prompts per day for Free plan
const FREE_DAILY_LIMIT = 3;

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
      console.warn('INSIGHT ALERT WEBHOOK FAILED', e);
    }
  } else {
    console.warn('INSIGHT ALERT', payload);
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

    // Parse request body - support both old format (messages array) and new format (sessionId + input)
    const body = await req.json();
    const { sessionId, input, messages, maxOutputTokens, persona, contextMessages } = body || {};
    
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

    // Check current usage (read-only check before OpenAI call)
    const usageDate = new Date().toISOString().split('T')[0]; // UTC date YYYY-MM-DD
    const { data: usageRow } = await supabase
      .from('insight_usage')
      .select('prompts_count')
      .eq('user_id', user.id)
      .eq('usage_date', usageDate)
      .maybeSingle();

    const currentCount = usageRow?.prompts_count ?? 0;
    if (currentCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Ai atins limita zilnică pentru planul Free (3 solicitări/zi).' },
        { status: 429 }
      );
    }

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
          console.error('Failed to create session:', sessErr);
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
        console.error('Failed to save user message:', insUserMsgErr);
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
        console.error('Failed to load history:', historyErr);
        return NextResponse.json({ error: 'Nu am putut încărca istoricul.' }, { status: 500 });
      }
      
      history = historyData || [];
    }

    // Build messages array for OpenAI (include system message + history)
    const personaKey = typeof persona === 'string' ? persona : null;
    let systemContent =
      'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- Pentru formule matematice, folosește DOAR marcatori LaTeX de tipul $ pentru formule inline (de exemplu: $E=mc^2$) și $$ pentru formule pe bloc (de exemplu: $$\\int_0^1 x dx$$). NU folosi marcatori standard LaTeX precum \\(, \\), \\[, \\].\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.';

    if (personaKey === 'ide') {
      systemContent =
        'Ești Insight, co-pilotul din PlanckCode IDE. Ajută utilizatorii să scrie, să explici și să refactorizezi cod (în special C++), să depanezi erori și să oferi exemple practice. Menține răspunsurile concentrate pe programare și algoritmică; dacă utilizatorul cere altceva, redirecționează-l respectuos către subiecte tehnice.\n\nIMPORTANT - Cum răspunzi:\n1. Dacă utilizatorul îți cere în mod clar să **aplici/actualizezi/înlocuiești/rezolvi** codul din editor (ex: „corectează în IDE”, „repară programul”, „rescrie fișierul”), răspunde EXCLUSIV cu un obiect JSON valid, fără text suplimentar înainte sau după. Structura obligatorie este:\n{\n  "type": "code_edit",\n  "target": { "file_name": "<nume_fisier>" },\n  "explanation": "<scurtă explicație a modificărilor>",\n  "full_content": "<TOT codul final, complet, folosind \\n pentru linii noi>",\n  "changes": []\n}\n\nREGULI PENTRU JSON:\n- Include întotdeauna în `full_content` varianta completă și corectă a întregului fișier (inclusiv linii nemodificate).\n- `changes` poate rămâne gol sau poate sumariza modificările (nu trimite patch-uri linie cu linie).\n- Nu adăuga explicații în afara câmpului `explanation`.\n- Dacă nu ești sigur că utilizatorul dorește aplicarea automată, întreabă-l sau furnizează codul în chat, nu trimite JSON.\n\n2. Dacă utilizatorul solicită doar explicații, exemple, sugestii sau nu menționează clar că vrea modificări directe în editor, răspunde în text normal (Markdown) și oferă codul în blocuri ` ```limbaj ... ``` `. Aceste blocuri vor putea fi inserate manual din interfață.\n\nDacă utilizatorul cere explicit să NU modifici editorul, respectă cererea și răspunde doar cu explicații/cod în chat.';
    }

    const systemMessage = {
      role: 'system' as const,
      content: systemContent,
    };

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

    // Prepare messages for OpenAI Chat Completions API
    const chatMessages = [
      systemMessage,
      ...toChatCompletionsMessages(sanitizedContextMessages),
      ...toChatCompletionsMessages(historyMessages)
    ];

    // Call OpenAI Chat Completions API with streaming
    // Using gpt-4o-mini - the cheapest available model
    const t0 = Date.now();
    let stream;
    try {
      stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cheapest available model
        messages: chatMessages,
        max_tokens: typeof maxOutputTokens === 'number' ? maxOutputTokens : 3000,
        stream: true,
      });
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
                  console.warn('Error while returning stream after abort:', returnErr);
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
              console.error('Failed to save assistant message:', insAsstMsgErr);
            }
          }

          if (!clientAborted) {
            // Only increment counter after successful OpenAI call
            const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
              'insight_check_and_increment',
              {
                p_user_id: user.id,
                p_daily_limit: FREE_DAILY_LIMIT,
              }
            );

            if (rpcErr) {
              console.error('RPC error after OpenAI success', rpcErr);
            } else if (!incrementAllowed) {
              console.warn('Counter increment failed after OpenAI success - race condition?');
            }
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
          console.error('Stream processing error:', streamError);
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
    console.error('Insight API error:', err);
    
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
    
    // Handle invalid API key
    if (err?.status === 401) {
      return NextResponse.json(
        { error: 'Configurare API invalidă. Contactează administratorul.' },
        { status: 500 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}

