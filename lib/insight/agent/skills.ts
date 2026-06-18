/**
 * Insight Agent Skills — simple, read-only tools for browsing the Planck site.
 *
 * Each skill is a plain object: { name, description, parameters, execute }.
 * No framework, no decorators, no registry magic. The chat route converts
 * them to OpenAI `tools` and runs a small tool-call loop before the
 * streaming response.
 *
 * All skills are read-only (SELECT) and rely on the same public RLS policies
 * the rest of the site uses (anon/authenticated). The supabase client passed
 * in is the user-scoped server client created in the chat route.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SkillSubject = 'fizica' | 'matematica' | 'informatica' | 'biologie';

export interface SkillResult {
  /** Returned to the LLM as the `tool` message content (always a JSON string on the wire). */
  content: string;
}

export interface Skill {
  name: string;
  description: string;
  /** JSON Schema for the `parameters` field — must be a plain object, not a string. */
  parameters: Record<string, unknown>;
  execute: (supabase: SupabaseClient, args: Record<string, unknown>) => Promise<SkillResult>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, max: number): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}

/** Normalise the subject param to one of the known values. */
function normaliseSubject(value: unknown): SkillSubject | undefined {
  const s = asString(value).toLowerCase();
  if (s === 'fizica' || s === 'fizică') return 'fizica';
  if (s === 'matematica' || s === 'matematică') return 'matematica';
  if (s === 'informatica' || s === 'informatică') return 'informatica';
  if (s === 'biologie') return 'biologie';
  return undefined;
}

/** Clamp limit to a sane range. */
function clampLimit(value: unknown, fallback = 5, max = 10): number {
  const n = asNumber(value);
  if (n === undefined) return fallback;
  return Math.max(1, Math.min(n, max));
}

// ---------------------------------------------------------------------------
// 1. browse_catalog — list the site structure (subjects → chapters)
// ---------------------------------------------------------------------------

const browseCatalogSkill: Skill = {
  name: 'browse_catalog',
  description:
    'Listează structura site-ului Planck: capitolele disponibile pentru fiecare materie (fizică, matematică, informatică, biologie). Folosește acest tool când utilizatorul vrea să vadă ce capitole sau trasee există. Nu necesită parametri, dar poți filtra după materie.',
  parameters: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        enum: ['fizica', 'matematica', 'informatica', 'biologie'],
        description: 'Filtrează după materie. Dacă nu se specifică, returnează toate capitolele.',
      },
    },
    required: [],
  },
  async execute(supabase, args) {
    const subject = normaliseSubject(args.subject);

    const { data, error } = await supabase
      .from('learning_path_chapters')
      .select('id, title, slug, description, materie, problem_category, order_index')
      .order('order_index', { ascending: true });

    if (error) {
      return { content: JSON.stringify({ error: error.message }) };
    }

    // Normalise the subject field: use `materie` if set, otherwise fall back
    // to `problem_category` (which holds subject markers for non-physics subjects).
    const rows = (data || []).map((row: Record<string, unknown>) => {
      const materie = asString(row.materie).toLowerCase();
      const category = asString(row.problem_category).toLowerCase();
      const rowSubject =
        materie === 'ai' ? 'informatica' :
        materie || (category === 'matematica' || category === 'informatica' || category === 'biologie' || category === 'ai' ? category : 'fizica');
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: truncate(asString(row.description), 120),
        subject: rowSubject,
        order_index: row.order_index,
      };
    });

    const filtered = subject
      ? rows.filter((r) => r.subject === subject)
      : rows;

    return {
      content: JSON.stringify({
        total: filtered.length,
        chapters: filtered.map((r) => ({
          title: r.title,
          slug: r.slug,
          subject: r.subject,
          description: r.description,
        })),
        note: 'Pentru a căuta probleme dintr-un capitol, folosește search_problems cu parametrul chapter= și cuvintele cheie din titlul capitolului (ex: chapter="miscare rectilinie uniforma"). Potrivirea este fuzzy.',
      }),
    };
  },
};

// ---------------------------------------------------------------------------
// 2. search_problems — search across physics / math / informatics problems
// ---------------------------------------------------------------------------

/** Strip Romanian diacritics and lowercase for fuzzy comparison. */
function normaliseText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Token-overlap score: how many tokens from `query` appear in `haystack`.
 * Both sides are normalised (diacritics stripped, lowercased).
 * Returns a score 0..1 — 1 means all query tokens found.
 */
function tokenOverlapScore(query: string, haystack: string): number {
  const qTokens = normaliseText(query).split(' ').filter((t) => t.length >= 3);
  if (qTokens.length === 0) return 0;
  const hText = normaliseText(haystack);
  let hits = 0;
  for (const token of qTokens) {
    if (hText.includes(token)) hits++;
  }
  return hits / qTokens.length;
}

const searchProblemsSkill: Skill = {
  name: 'search_problems',
  description:
    'Caută probleme în catalogul Planck (fizică, matematică, informatică). Poți filtra după materie, clasă, dificultate, capitol sau text liber. Căutarea după capitol este fuzzy — nu trebuie să potrivești exact titlul; folosește cuvintele cheie din titlul capitolului (ex: "miscare rectilinie uniforma" găsește probleme din capitolul "Miscarea rectilinie si uniforma a punctului material"). Returnează o listă scurtă cu titlu, dificultate, capitol și URL.',
  parameters: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        enum: ['fizica', 'matematica', 'informatica'],
        description: 'Materia. Dacă nu se specifică, caută în toate.',
      },
      class: {
        type: 'integer',
        enum: [9, 10, 11, 12],
        description: 'Clasa (9-12).',
      },
      difficulty: {
        type: 'string',
        description: 'Dificultatea (ex: "Ușor", "Mediu", "Avansat", "Greu", "Inițiere").',
      },
      chapter: {
        type: 'string',
        description: 'Caută probleme dintr-un capitol specific. Folosește cuvintele cheie din titlul capitolului (ex: "miscare rectilinie", "electrostatica", "circuite alternativ"). Potrivirea este fuzzy, nu necesită titlul exact.',
      },
      search: {
        type: 'string',
        description: 'Text liber pentru căutare în titlu, enunț și tag-uri.',
      },
      limit: {
        type: 'integer',
        description: 'Număr maxim de rezultate (default 5, max 10).',
      },
    },
    required: [],
  },
  async execute(supabase, args) {
    const subject = normaliseSubject(args.subject);
    const classLevel = asNumber(args.class);
    const difficulty = asString(args.difficulty);
    const chapterQuery = asString(args.chapter);
    const searchText = asString(args.search);
    const limit = clampLimit(args.limit, 5, 10);

    const subjectsToQuery: SkillSubject[] = subject
      ? [subject]
      : (['fizica', 'matematica', 'informatica'] as SkillSubject[]);

    const results: Array<Record<string, unknown>> = [];

    // Score threshold for fuzzy chapter matching (token overlap).
    const CHAPTER_MATCH_THRESHOLD = 0.4;

    for (const subj of subjectsToQuery) {
      if (subj === 'biologie') continue;

      if (subj === 'fizica') {
        let query = supabase
          .from('problems')
          .select('id, title, difficulty, category, class, statement, created_at')
          .order('created_at', { ascending: false })
          .limit(300);

        if (classLevel !== undefined) query = query.eq('class', classLevel);
        if (difficulty) query = query.ilike('difficulty', `%${difficulty}%`);

        const { data, error } = await query;
        if (!error && data) {
          for (const row of data) {
            const haystack = `${row.title} ${row.statement} ${row.category}`;

            // Fuzzy chapter matching
            if (chapterQuery) {
              const score = tokenOverlapScore(chapterQuery, row.category || row.title || '');
              if (score < CHAPTER_MATCH_THRESHOLD) continue;
            }

            // Text search (normalised)
            if (searchText) {
              const searchScore = tokenOverlapScore(searchText, haystack);
              if (searchScore < CHAPTER_MATCH_THRESHOLD) continue;
            }

            results.push({
              subject: 'fizica',
              id: row.id,
              title: row.title,
              difficulty: row.difficulty,
              chapter: row.category,
              class: row.class,
              url: `/probleme/${encodeURIComponent(String(row.id))}`,
              excerpt: truncate(asString(row.statement), 150),
            });
          }
        }
      }

      if (subj === 'matematica') {
        let query = supabase
          .from('math_problems')
          .select('id, title, difficulty, chapter, class, statement, tags, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(300);

        if (classLevel !== undefined) query = query.eq('class', classLevel);
        if (difficulty) query = query.ilike('difficulty', `%${difficulty}%`);

        const { data, error } = await query;
        if (!error && data) {
          for (const row of data) {
            const haystack = `${row.title} ${row.statement} ${row.chapter} ${(row.tags || []).join(' ')}`;

            if (chapterQuery) {
              const score = tokenOverlapScore(chapterQuery, row.chapter || row.title || '');
              if (score < CHAPTER_MATCH_THRESHOLD) continue;
            }

            if (searchText) {
              const searchScore = tokenOverlapScore(searchText, haystack);
              if (searchScore < CHAPTER_MATCH_THRESHOLD) continue;
            }

            results.push({
              subject: 'matematica',
              id: row.id,
              title: row.title,
              difficulty: row.difficulty,
              chapter: row.chapter,
              class: row.class,
              url: `/matematica/probleme/${encodeURIComponent(String(row.id))}`,
              excerpt: truncate(asString(row.statement), 150),
            });
          }
        }
      }

      if (subj === 'informatica') {
        let query = supabase
          .from('coding_problems')
          .select('id, slug, title, difficulty, chapter, class, statement_markdown, tags, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(300);

        if (classLevel !== undefined) query = query.eq('class', classLevel);
        if (difficulty) query = query.ilike('difficulty', `%${difficulty}%`);

        const { data, error } = await query;
        if (!error && data) {
          for (const row of data) {
            const haystack = `${row.title} ${row.statement_markdown} ${row.chapter} ${(row.tags || []).join(' ')}`;

            if (chapterQuery) {
              const score = tokenOverlapScore(chapterQuery, row.chapter || row.title || '');
              if (score < CHAPTER_MATCH_THRESHOLD) continue;
            }

            if (searchText) {
              const searchScore = tokenOverlapScore(searchText, haystack);
              if (searchScore < CHAPTER_MATCH_THRESHOLD) continue;
            }

            results.push({
              subject: 'informatica',
              id: row.slug,
              title: row.title,
              difficulty: row.difficulty,
              chapter: row.chapter,
              class: row.class,
              url: `/informatica/probleme/${encodeURIComponent(String(row.slug))}`,
              excerpt: truncate(asString(row.statement_markdown), 150),
            });
          }
        }
      }
    }

    const trimmed = results.slice(0, limit);

    // Push resource cards as a side-effect artifact so the UI renders
    // clickable PlanckResourceCard components below the response.
    pushResourceArtifact(
      'Probleme găsite',
      trimmed.map((r) => ({
        type: 'problem' as const,
        id: String(r.id),
        title: String(r.title),
        subtitle: r.chapter ? String(r.chapter) : null,
        subject: r.subject as import('./types').InsightAgentSubject,
        topic: r.chapter ? String(r.chapter) : null,
        difficulty: r.difficulty ? String(r.difficulty) : null,
        url: String(r.url),
      }))
    );

    return {
      content: JSON.stringify({
        total: trimmed.length,
        problems: trimmed,
        note: 'Problemele găsite vor fi afișate automat ca carduri interactive sub răspuns. NU scrie titlurile, enunțurile sau URL-urile în text — menționează doar pe scurt ce ai găsit.',
      }),
    };
  },
};

const getProblemSkill: Skill = {
  name: 'get_problem',
  description:
    'Returnează enunțul complet și detaliile unei singure probleme. Necesită materia și ID-ul (sau slug pentru informatică).',
  parameters: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        enum: ['fizica', 'matematica', 'informatica'],
        description: 'Materia problemei.',
      },
      id: {
        type: 'string',
        description: 'ID-ul problemei (text pentru fizică/matemetică, slug pentru informatică).',
      },
    },
    required: ['subject', 'id'],
  },
  async execute(supabase, args) {
    const subject = normaliseSubject(args.subject);
    const id = asString(args.id);

    if (!subject || !id) {
      return { content: JSON.stringify({ error: 'subject și id sunt obligatorii.' }) };
    }

    if (subject === 'fizica') {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { content: JSON.stringify({ error: 'Problemă inexistentă.' }) };
      }

      const url = `/probleme/${encodeURIComponent(String(data.id))}`;
      pushResourceArtifact('Problemă', [{
        type: 'problem',
        id: String(data.id),
        title: String(data.title),
        subtitle: data.category ? String(data.category) : null,
        subject: 'fizica',
        topic: data.category ? String(data.category) : null,
        difficulty: data.difficulty ? String(data.difficulty) : null,
        url,
      }]);

      return {
        content: JSON.stringify({
          subject: 'fizica',
          id: data.id,
          title: data.title,
          difficulty: data.difficulty,
          category: data.category,
          class: data.class,
          statement: data.statement,
          description: data.description,
          youtube_url: data.youtube_url,
          url,
          note: 'Problema va fi afișată automat ca card interactiv sub răspuns.',
        }),
      };
    }

    if (subject === 'matematica') {
      const { data, error } = await supabase
        .from('math_problems')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { content: JSON.stringify({ error: 'Problemă inexistentă.' }) };
      }

      const url = `/matematica/probleme/${encodeURIComponent(String(data.id))}`;
      pushResourceArtifact('Problemă', [{
        type: 'problem',
        id: String(data.id),
        title: String(data.title),
        subtitle: data.chapter ? String(data.chapter) : null,
        subject: 'matematica',
        topic: data.chapter ? String(data.chapter) : null,
        difficulty: data.difficulty ? String(data.difficulty) : null,
        url,
      }]);

      return {
        content: JSON.stringify({
          subject: 'matematica',
          id: data.id,
          title: data.title,
          difficulty: data.difficulty,
          chapter: data.chapter,
          class: data.class,
          statement: data.statement,
          description: data.description,
          url,
          note: 'Problema va fi afișată automat ca card interactiv sub răspuns.',
        }),
      };
    }

    if (subject === 'informatica') {
      const { data, error } = await supabase
        .from('coding_problems')
        .select('*')
        .eq('slug', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { content: JSON.stringify({ error: 'Problemă inexistentă.' }) };
      }

      const url = `/informatica/probleme/${encodeURIComponent(String(data.slug))}`;
      pushResourceArtifact('Problemă', [{
        type: 'problem',
        id: String(data.slug),
        title: String(data.title),
        subtitle: data.chapter ? String(data.chapter) : null,
        subject: 'informatica',
        topic: data.chapter ? String(data.chapter) : null,
        difficulty: data.difficulty ? String(data.difficulty) : null,
        url,
      }]);

      return {
        content: JSON.stringify({
          subject: 'informatica',
          id: data.slug,
          title: data.title,
          difficulty: data.difficulty,
          chapter: data.chapter,
          class: data.class,
          statement: data.statement_markdown,
          requirement: data.requirement_markdown,
          input_format: data.input_format,
          output_format: data.output_format,
          constraints: data.constraints_markdown,
          time_limit_ms: data.time_limit_ms,
          memory_limit_kb: data.memory_limit_kb,
          language: data.language,
          url,
          note: 'Problema va fi afișată automat ca card interactiv sub răspuns.',
        }),
      };
    }

    return { content: JSON.stringify({ error: 'Materie nesuportată.' }) };
  },
};

// ---------------------------------------------------------------------------
// 4. list_lessons — list lessons for a subject / chapter
// ---------------------------------------------------------------------------

const listLessonsSkill: Skill = {
  name: 'list_lessons',
  description:
    'Listează lecțiile disponibile pentru o materie sau un capitol. Returnează titlul, slug-ul, tipul și URL-ul. Pentru conținutul complet al unei lecții folosește get_lesson.',
  parameters: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        enum: ['fizica', 'matematica', 'informatica', 'biologie'],
        description: 'Filtrează lecțiile după materie.',
      },
      chapterSlug: {
        type: 'string',
        description: 'Slug-ul capitolului (din browse_catalog). Dacă se specifică, returnează lecțiile acelui capitol.',
      },
      limit: {
        type: 'integer',
        description: 'Număr maxim de rezultate (default 10, max 20).',
      },
    },
    required: [],
  },
  async execute(supabase, args) {
    const subject = normaliseSubject(args.subject);
    const chapterSlug = asString(args.chapterSlug);
    const limit = clampLimit(args.limit, 10, 20);

    // Resolve chapter id(s) if slug is provided, otherwise resolve by subject.
    let chapterIds: string[] = [];

    if (chapterSlug) {
      const { data: ch } = await supabase
        .from('learning_path_chapters')
        .select('id, title, slug, materie, problem_category')
        .eq('slug', chapterSlug)
        .limit(5);

      chapterIds = (ch || []).map((r: Record<string, unknown>) => String(r.id));
    } else if (subject) {
      const { data: ch } = await supabase
        .from('learning_path_chapters')
        .select('id, materie, problem_category');

      chapterIds = (ch || [])
        .filter((row: Record<string, unknown>) => {
          const m = asString(row.materie).toLowerCase();
          const pc = asString(row.problem_category).toLowerCase();
          const rowSubj =
            m === 'ai' ? 'informatica' :
            m || (pc === 'matematica' || pc === 'informatica' || pc === 'biologie' || pc === 'ai' ? pc : 'fizica');
          return rowSubj === subject;
        })
        .map((row: Record<string, unknown>) => String(row.id));
    }

    let query = supabase
      .from('learning_path_lessons')
      .select('id, title, slug, lesson_type, chapter_id, order_index, is_active')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(50);

    if (chapterIds.length > 0) {
      query = query.in('chapter_id', chapterIds);
    }

    const { data, error } = await query;
    if (error) {
      return { content: JSON.stringify({ error: error.message }) };
    }

    const lessons = (data || []).slice(0, limit).map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      lesson_type: row.lesson_type,
    }));

    // Push lesson cards as resource artifacts.
    pushResourceArtifact(
      'Lecții găsite',
      lessons.map((l) => ({
        type: 'lesson' as const,
        id: String(l.id),
        title: String(l.title),
        subtitle: null,
        url: l.slug ? `/invata?lesson=${encodeURIComponent(String(l.slug))}` : `/invata`,
      }))
    );

    return {
      content: JSON.stringify({
        total: lessons.length,
        lessons,
        note: 'Lecțiile găsite vor fi afișate automat ca carduri interactive sub răspuns. NU scrie titlurile sau URL-urile în text.',
      }),
    };
  },
};

// ---------------------------------------------------------------------------
// 5. get_lesson — get a lesson's items / content
// ---------------------------------------------------------------------------

const getLessonSkill: Skill = {
  name: 'get_lesson',
  description:
    'Returnează conținutul unei lecții: lista de itemi (text, video, problemă, grilă) cu detaliile relevante. Necesită ID-ul lecției (din list_lessons).',
  parameters: {
    type: 'object',
    properties: {
      lessonId: {
        type: 'string',
        description: 'ID-ul lecției (UUID, din list_lessons).',
      },
    },
    required: ['lessonId'],
  },
  async execute(supabase, args) {
    const lessonId = asString(args.lessonId);
    if (!lessonId) {
      return { content: JSON.stringify({ error: 'lessonId este obligatoriu.' }) };
    }

    // Fetch the lesson metadata.
    const { data: lesson, error: lessonErr } = await supabase
      .from('learning_path_lessons')
      .select('id, title, slug, lesson_type, chapter_id')
      .eq('id', lessonId)
      .single();

    if (lessonErr || !lesson) {
      return { content: JSON.stringify({ error: 'Lecție inexistentă.' }) };
    }

    // Fetch the lesson items.
    const { data: items, error: itemsErr } = await supabase
      .from('learning_path_lesson_items')
      .select('id, item_type, title, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id, order_index, content_json')
      .eq('lesson_id', lessonId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (itemsErr) {
      return { content: JSON.stringify({ error: itemsErr.message }) };
    }

    // Enrich text items with markdown content from the legacy `lessons` table.
    const enrichedItems = await Promise.all(
      (items || []).map(async (item: Record<string, unknown>) => {
        const itemType = asString(item.item_type);
        const base: Record<string, unknown> = {
          order: item.order_index,
          type: itemType,
          title: item.title,
        };

        if (itemType === 'video') {
          base.youtube_url = item.youtube_url;
        }

        if (itemType === 'text' && item.cursuri_lesson_slug) {
          const { data: lessonContent } = await supabase
            .from('lessons')
            .select('content')
            .ilike('title', asString(item.cursuri_lesson_slug).replace(/-/g, ' '))
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (lessonContent?.content) {
            base.markdown = truncate(lessonContent.content, 1500);
          }
        }

        if (itemType === 'grila' && item.quiz_question_id) {
          const { data: quiz } = await supabase
            .from('quiz_questions')
            .select('statement, difficulty, class, materie')
            .eq('id', String(item.quiz_question_id))
            .maybeSingle();

          if (quiz) {
            base.quiz_statement = truncate(asString(quiz.statement), 300);
            base.quiz_difficulty = quiz.difficulty;
            base.quiz_class = quiz.class;
          }
        }

        if (itemType === 'problem' || itemType === 'math_problem' || itemType === 'coding_problem') {
          base.problem_id = item.problem_id;
          const table =
            itemType === 'math_problem' ? 'math_problems' :
            itemType === 'coding_problem' ? 'coding_problems' :
            'problems';

          const selectCols =
            itemType === 'coding_problem'
              ? 'title, statement_markdown'
              : 'title, statement';

          const idCol = itemType === 'coding_problem' ? 'id' : 'id';

          const { data: prob } = await supabase
            .from(table)
            .select(selectCols)
            .eq(idCol, String(item.problem_id))
            .eq('is_active', true)
            .maybeSingle();

          if (prob) {
            base.problem_title = prob.title;
            const statement = (prob as Record<string, unknown>).statement_markdown
              || (prob as Record<string, unknown>).statement;
            base.problem_excerpt = truncate(asString(statement), 300);
          }
        }

        if (itemType === 'custom_text' || itemType === 'simulation' || itemType === 'poll') {
          base.content_json = item.content_json;
        }

        return base;
      })
    );

    return {
      content: JSON.stringify({
        lesson: {
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          lesson_type: lesson.lesson_type,
        },
        items: enrichedItems,
      }),
    };
  },
};

// ---------------------------------------------------------------------------
// 6. search_quizzes — search grila / quiz questions
// ---------------------------------------------------------------------------

const searchQuizzesSkill: Skill = {
  name: 'search_quizzes',
  description:
    'Caută întrebări de tip grilă (quiz) din catalogul Planck (fizică și biologie). Poți filtra după materie, clasă și dificultate.',
  parameters: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        enum: ['fizica', 'biologie'],
        description: 'Materia. Dacă nu se specifică, caută în toate.',
      },
      class: {
        type: 'integer',
        enum: [9, 10, 11, 12],
        description: 'Clasa (9-12).',
      },
      difficulty: {
        type: 'integer',
        enum: [1, 2, 3],
        description: 'Dificultatea: 1 (ușor), 2 (mediu), 3 (greu).',
      },
      limit: {
        type: 'integer',
        description: 'Număr maxim de rezultate (default 5, max 10).',
      },
    },
    required: [],
  },
  async execute(supabase, args) {
    const subject = normaliseSubject(args.subject);
    const classLevel = asNumber(args.class);
    const difficulty = asNumber(args.difficulty);
    const limit = clampLimit(args.limit, 5, 10);

    let query = supabase
      .from('quiz_questions')
      .select('id, question_id, statement, difficulty, class, materie, title, tags')
      .order('created_at', { ascending: false })
      .limit(100);

    if (classLevel !== undefined) query = query.eq('class', classLevel);
    if (difficulty !== undefined) query = query.eq('difficulty', difficulty);
    if (subject === 'fizica') {
      query = query.or('materie.eq.fizica,materie.is.null');
    } else if (subject === 'biologie') {
      query = query.eq('materie', 'biologie');
    }

    const { data, error } = await query;
    if (error) {
      return { content: JSON.stringify({ error: error.message }) };
    }

    const quizzes = (data || []).slice(0, limit).map((row: Record<string, unknown>) => {
      const materie = asString(row.materie).toLowerCase() || 'fizica';
      const urlBase = materie === 'biologie' ? 'biologie/grile' : 'grile';
      return {
        id: row.id,
        question_id: row.question_id,
        title: row.title,
        difficulty: row.difficulty,
        class: row.class,
        materie,
        excerpt: truncate(asString(row.statement), 200),
        url: `/${urlBase}?question=${encodeURIComponent(String(row.id))}`,
      };
    });

    // Push quiz cards as resource artifacts.
    pushResourceArtifact(
      'Grile găsite',
      quizzes.map((q) => ({
        type: 'quiz' as const,
        id: String(q.id),
        title: q.title ? String(q.title) : (q.excerpt ? String(q.excerpt) : `Grilă ${q.question_id}`),
        subtitle: q.materie ? String(q.materie) : null,
        subject: q.materie as import('./types').InsightAgentSubject,
        difficulty: q.difficulty != null ? String(q.difficulty) : null,
        url: String(q.url),
      }))
    );

    return {
      content: JSON.stringify({
        total: quizzes.length,
        quizzes,
        note: 'Grilele găsite vor fi afișate automat ca carduri interactive sub răspuns. NU scrie titlurile sau URL-urile în text.',
      }),
    };
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 7. ask_user — ask the user a multiple-choice question to learn about them
// ---------------------------------------------------------------------------

const askUserSkill: Skill = {
  name: 'ask_user',
  description:
    'Pune o întrebare utilizatorului cu opțiuni multiple choice pentru a-l cunoaște mai bine (nivel, preferințe, obiective). Opțiunile vor fi afișate ca butoane interactive; utilizatorul poate alege o opțiune sau poate scrie propriul răspuns. Folosește acest tool când ai nevoie de informații despre utilizator pentru a personaliza răspunsul. Nu folosi acest tool pentru întrebări despre conținutul site-ului (folosește browse_catalog/search_problems etc. pentru asta). Maxim 5 opțiuni.',
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'Întrebarea pentru utilizator (clară, scurtă, în română).',
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Opțiunile disponibile (2-5, scurte și clare).',
        maxItems: 5,
      },
      allowCustom: {
        type: 'boolean',
        description: 'Dacă true (default), utilizatorul poate alege "Altul" și scrie propriul răspuns.',
      },
      placeholder: {
        type: 'string',
        description: 'Text placeholder pentru câmpul de text custom (ex: "Descrie pe scurt...").',
      },
    },
    required: ['question', 'options'],
  },
  async execute(_supabase, args) {
    const question = asString(args.question);
    const options = asStringArray(args.options).slice(0, 5);
    const allowCustom = args.allowCustom !== false;
    const placeholder = asString(args.placeholder) || 'Scrie propriul răspuns...';

    if (!question || options.length < 2) {
      return {
        content: JSON.stringify({
          error: 'question și cel puțin 2 opțiuni sunt obligatorii.',
        }),
      };
    }

    // Record the question artifact so the chat route can collect it and
    // include it in the streamed response. The LLM gets confirmation that
    // the question will be shown; it should NOT repeat the question text.
    pendingQuestionArtifacts.push({
      type: 'agent_question',
      question,
      options,
      allowCustom,
      placeholder,
    });

    return {
      content: JSON.stringify({
        status: 'question_shown',
        question,
        options,
        allowCustom,
        note: 'Întrebarea a fost afișată utilizatorului cu butoane interactive. Nu repeta întrebarea în răspuns. Așteaptă răspunsul utilizatorului în mesajul următor.',
      }),
    };
  },
};

// ---------------------------------------------------------------------------
// Question + Resource artifact collection (side-channel for skills)
// ---------------------------------------------------------------------------

const pendingQuestionArtifacts: import('./types').InsightMessageArtifact[] = [];
const pendingResourceArtifacts: import('./types').InsightMessageArtifact[] = [];

/** Reset both collectors before a new skill loop starts. */
export function resetPendingQuestionArtifacts(): void {
  pendingQuestionArtifacts.length = 0;
}

/** Drain collected question artifacts after the skill loop ends. */
export function drainPendingQuestionArtifacts(): import('./types').InsightMessageArtifact[] {
  const out = [...pendingQuestionArtifacts];
  pendingQuestionArtifacts.length = 0;
  return out;
}

/** Reset the resource artifact collector before a new skill loop starts. */
export function resetPendingResourceArtifacts(): void {
  pendingResourceArtifacts.length = 0;
}

/** Drain collected resource artifacts after the skill loop ends. */
export function drainPendingResourceArtifacts(): import('./types').InsightMessageArtifact[] {
  const out = [...pendingResourceArtifacts];
  pendingResourceArtifacts.length = 0;
  return out;
}

/** Push resource references as a side-effect artifact (called by search skills). */
function pushResourceArtifact(title: string, resources: import('./types').PlanckResourceReference[]): void {
  if (!resources.length) return;
  // Deduplicate by type:id across all collected resources.
  const seen = new Set<string>();
  for (const art of pendingResourceArtifacts) {
    if (art.type === 'resource_references') {
      for (const r of art.resources) seen.add(`${r.type}:${r.id}`);
    }
  }
  const fresh = resources.filter((r) => !seen.has(`${r.type}:${r.id}`));
  if (!fresh.length) return;
  pendingResourceArtifacts.push({ type: 'resource_references', title, resources: fresh });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const INSIGHT_AGENT_SKILLS: Skill[] = [
  browseCatalogSkill,
  searchProblemsSkill,
  getProblemSkill,
  listLessonsSkill,
  getLessonSkill,
  searchQuizzesSkill,
  askUserSkill,
];

/**
 * Convert skills to the OpenAI Chat Completions `tools` array format.
 * Each skill becomes a `{ type: 'function', function: { name, description, parameters } }` entry.
 */
export function skillsToOpenAITools(
  skills: Skill[] = INSIGHT_AGENT_SKILLS
): Array<{
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}> {
  return skills.map((s) => ({
    type: 'function' as const,
    function: {
      name: s.name,
      description: s.description,
      parameters: s.parameters,
    },
  }));
}

/**
 * Execute a skill by name. Returns the JSON string content for the `tool` message.
 * If the skill name is unknown, returns an error JSON.
 */
export async function executeSkill(
  skillName: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<string> {
  const skill = INSIGHT_AGENT_SKILLS.find((s) => s.name === skillName);
  if (!skill) {
    return JSON.stringify({ error: `Skill necunoscut: ${skillName}` });
  }
  try {
    const result = await skill.execute(supabase, args || {});
    return result.content;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare internă.';
    return JSON.stringify({ error: message });
  }
}

/** Maximum number of tool-call round-trips before we force a final answer. */
export const MAX_SKILL_ITERATIONS = 4;
