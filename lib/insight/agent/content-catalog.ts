import type { SupabaseClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/slug';
import type { InsightAgentIntent, InsightAgentSubject, PlanckResourceReference } from './types';

type SearchInput = {
  intent: InsightAgentIntent;
  userInput: string;
  requestText?: string;
  limit?: number;
};

type RequestedResourceKind = 'problem' | 'lesson' | 'quiz' | 'any';

type SearchPreferences = {
  requestedKind: RequestedResourceKind;
  requestedKinds: Array<Exclude<RequestedResourceKind, 'any'>>;
  requestedCounts: Partial<Record<Exclude<RequestedResourceKind, 'any'>, number>>;
  easy: boolean;
  medium: boolean;
  advanced: boolean;
  topicAliases: string[];
};

export type PlanckCatalogRequestPolicy = {
  directResourceAnswer: boolean;
  resourceOnlyAnswer: boolean;
  artifactLimit: number;
  responseInstruction: string;
};

type Candidate = PlanckResourceReference & {
  searchable: string;
  baseScore: number;
};

const SUBJECT_ALIASES: Record<InsightAgentSubject, string[]> = {
  fizica: ['fizica', 'fizică', 'physics'],
  matematica: ['matematica', 'matematică', 'math'],
  informatica: ['informatica', 'informatică', 'programare', 'algoritmi', 'coding'],
  biologie: ['biologie', 'biology'],
  general: [],
};

const STOP_WORDS = new Set([
  'care',
  'este',
  'sunt',
  'pentru',
  'despre',
  'vreau',
  'recomanda',
  'recomandă',
  'plan',
  'lectie',
  'lecție',
  'probleme',
  'problemă',
  'test',
  'ajuta',
  'ajută',
  'invata',
  'învață',
  'invat',
  'învat',
  'dami',
  'da',
  'imi',
  'îmi',
  'te',
  'rog',
  'context',
  'utilizatorul',
  'harta',
  'lectiilor',
  'planck',
  'academy',
  'rolul',
  'tau',
  'tutor',
  'liceu',
  'raspunde',
  'clar',
  'romana',
  'romaneste',
  'traseu',
  'selectat',
  'capitol',
  'curent',
  'lectii',
  'status',
  'minute',
  'min',
  'acest',
  'aceasta',
  'relevant',
  'relevanta',
]);

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bmacanic[aaei]?\b/g, 'mecanica')
    .replace(/\bmacanica\b/g, 'mecanica')
    .replace(/\bmecanicii\b/g, 'mecanica')
    .replace(/\bincepator(?:i|ului|ilor)?\b/g, 'incepator')
    .replace(/\bincepatoare\b/g, 'incepator')
    .replace(/\bîncepator(?:i|ului|ilor)?\b/g, 'incepator')
    .replace(/\busor\b/g, 'usor');
}

function countRequestedKind(normalized: string, singular: string, plural: string) {
  const explicit = normalized.match(
    new RegExp(`\\b(1|2|3|4|5|6|un|o|una|unu|doi|doua|două|trei|patru|cinci|sase|șase)\\s+${plural}\\b`)
  );
  const value = explicit?.[1];
  if (value === '2' || value === 'doi' || value === 'doua' || value === 'două') return 2;
  if (value === '3' || value === 'trei') return 3;
  if (value === '4' || value === 'patru') return 4;
  if (value === '5' || value === 'cinci') return 5;
  if (value === '6' || value === 'sase' || value === 'șase') return 6;
  if (value === '1' || value === 'un' || value === 'o' || value === 'una' || value === 'unu') return 1;
  if (
    new RegExp(
      `\\b(da-mi|dami|vreau|trimite-mi|gaseste-mi|gasește-mi|recomanda-mi|recomandă-mi|sugereaza-mi|sugerează-mi)\\s+(?:\\w+\\s+){0,4}(?:\\d+|un|o|una|unu|doi|doua|două|trei|patru|cinci|sase|șase\\s+)?(${singular}|${plural})\\b`
    ).test(normalized)
  ) {
    return 1;
  }
  return 0;
}

function inferPreferences(input: SearchInput): SearchPreferences {
  const normalized = normalizeText(`${input.intent.topic ?? ''} ${input.userInput}`);
  const requestNormalized = normalizeText(input.requestText ?? input.userInput);
  const topicAliases: string[] = [];

  if (/\bmecanica|newton|forta|viteza|acceleratie|energie mecanica|lucru mecanic\b/.test(normalized)) {
    topicAliases.push(
      'mecanica',
      'mecanic',
      'principiile mecanicii',
      'legile lui newton',
      'forta',
      'viteza',
      'acceleratie',
      'lucru mecanic',
      'energie mecanica'
    );
  }
  if (/\bcinematica|miscare|traiectorie|mru|mruv|viteza medie|punct material\b/.test(normalized)) {
    topicAliases.push(
      'cinematica',
      'cinematica punctului material',
      'miscare rectilinie',
      'mru',
      'mruv',
      'traiectoria punctului material',
      'viteza medie',
      'viteza',
      'acceleratie'
    );
  }
  if (/\belectricitate|circuit|ohm|kirchhoff|rezistor|curent|tensiune\b/.test(normalized)) {
    topicAliases.push('electricitate', 'circuit', 'ohm', 'kirchhoff', 'rezistor', 'curent', 'tensiune');
  }
  if (/\btermodinamica|caldura|gaz|izobar|izocor|izoterm\b/.test(normalized)) {
    topicAliases.push('termodinamica', 'caldura', 'gaz ideal', 'energie interna');
  }
  if (/\boptica|lentila|oglinda|lumina|refractie|reflexie\b/.test(normalized)) {
    topicAliases.push('optica', 'lumina', 'lentila', 'oglinda', 'refractie', 'reflexie');
  }

  const requestedCounts = {
    problem: Math.max(
      countRequestedKind(requestNormalized, 'problema', 'probleme'),
      countRequestedKind(requestNormalized, 'exercitiu', 'exercitii')
    ),
    lesson: Math.max(
      countRequestedKind(requestNormalized, 'lectie', 'lectii'),
      countRequestedKind(requestNormalized, 'curs', 'cursuri')
    ),
    quiz: Math.max(
      countRequestedKind(requestNormalized, 'grila', 'grile'),
      countRequestedKind(requestNormalized, 'quiz', 'quizuri')
    ),
  };
  const requestedKinds = (Object.entries(requestedCounts) as Array<[Exclude<RequestedResourceKind, 'any'>, number]>)
    .filter(([, count]) => count > 0)
    .map(([kind]) => kind);
  const requestedKind = requestedKinds[0] ?? 'any';

  return {
    requestedKind,
    requestedKinds,
    requestedCounts,
    easy: /\bincepator|incepatori|initiere|introductiv|usor|usoara|easy|beginner|basic\b/.test(requestNormalized),
    medium: /\bmediu|intermediar\b/.test(requestNormalized),
    advanced: /\bavansat|greu|dificil|concurs|olimpiada\b/.test(requestNormalized),
    topicAliases: Array.from(new Set(topicAliases)),
  };
}

export function getPlanckCatalogRequestPolicy(input: SearchInput): PlanckCatalogRequestPolicy {
  const preferences = inferPreferences(input);
  const normalized = normalizeText(input.requestText ?? input.userInput);
  const requestedTotal = Object.values(preferences.requestedCounts).reduce((sum, count) => sum + (count ?? 0), 0);
  const asksForMultiple =
    requestedTotal > 1 ||
    preferences.requestedKinds.length > 1 ||
    /\b(mai multe|cateva|câteva|lista|list[ăa]|set|2|doi|doua|două|4|patru|3|trei|5|cinci|recomandari|recomandări|plan|program)\b/.test(
      normalized
    );
  const asksForSingle =
    /\b(o|un|una|unu|singura|singur[ăa]|doar una|doar unul)\b/.test(normalized) ||
    /\bda-mi|dami|vreau|trimite-mi|gaseste-mi|găsește-mi\b/.test(normalized);
  const asksToFetchResources =
    /\bda-mi|dami|vreau|trimite-mi|gaseste-mi|găsește-mi|recomanda-mi|recomandă-mi\b/.test(normalized);
  const directResourceAnswer =
    preferences.requestedKind !== 'any' &&
    input.intent.type !== 'plan' &&
    asksForSingle &&
    !asksForMultiple;
  const resourceOnlyAnswer =
    preferences.requestedKind !== 'any' &&
    input.intent.type !== 'plan' &&
    asksToFetchResources &&
    (directResourceAnswer || asksForMultiple);
  const shouldAttachArtifacts =
    resourceOnlyAnswer ||
    input.intent.type === 'plan' ||
    input.intent.type === 'recommendation' ||
    preferences.requestedKind !== 'any';

  return {
    directResourceAnswer,
    resourceOnlyAnswer,
    artifactLimit: !shouldAttachArtifacts
      ? 0
      : directResourceAnswer
        ? 1
        : input.intent.type === 'plan'
          ? 6
          : requestedTotal > 0
            ? Math.min(Math.max(requestedTotal, 1), 6)
          : preferences.requestedKind === 'lesson'
            ? 3
            : 4,
    responseInstruction: directResourceAnswer
      ? 'Utilizatorul cere o singură resursă Planck. Răspunde cu o singură propoziție scurtă că ai găsit resursa. Nu descrie enunțul, nu copia titlul, nu lista alternative și nu scrie link markdown; cardul de resursă va fi afișat separat sub mesaj.'
      : resourceOnlyAnswer
        ? 'Utilizatorul cere resurse Planck concrete. Răspunde cu o singură propoziție scurtă că ai găsit resurse potrivite. Nu descrie enunțurile, nu lista alternative și nu scrie linkuri; cardurile de resursă vor fi afișate separat sub mesaj.'
      : 'NU recomanda probleme, lecții, cursuri sau alte resurse Planck decât dacă utilizatorul le cere explicit. Răspunde la întrebare fără a propune resurse din platformă.',
  };
}

export function buildDirectResourceFoundText(resource: PlanckResourceReference) {
  if (resource.type === 'problem') return 'Am găsit o problemă potrivită în Planck.';
  if (resource.type === 'lesson' || resource.type === 'course') return 'Am găsit o lecție potrivită în Planck.';
  if (resource.type === 'quiz') return 'Am găsit o grilă potrivită în Planck.';
  if (resource.type === 'learning_path') return 'Am găsit un traseu potrivit în Planck.';
  if (resource.type === 'flashcard_deck') return 'Am găsit un set de flashcard-uri potrivit în Planck.';
  return 'Am găsit o resursă potrivită în Planck.';
}

export function buildResourceFoundText(resources: PlanckResourceReference[]) {
  if (resources.length === 1) return buildDirectResourceFoundText(resources[0]);
  return 'Am găsit resurse potrivite în Planck.';
}

function extractTerms(input: SearchInput): string[] {
  const preferences = inferPreferences(input);
  const explicitContext = extractExplicitPlanckContext(input.userInput);
  const raw = [
    input.intent.topic,
    input.intent.subject !== 'general' ? input.intent.subject : null,
    ...SUBJECT_ALIASES[input.intent.subject],
    ...preferences.topicAliases,
    ...explicitContext,
    input.userInput,
  ]
    .filter(Boolean)
    .join(' ');

  const terms = normalizeText(raw)
    .split(/[^a-z0-9+]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));

  return Array.from(new Set(terms)).slice(0, 12);
}

function extractExplicitPlanckContext(input: string): string[] {
  const snippets: string[] = [];

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const chapterMatch = line.match(/^Capitol curent:\s*(.+?)\.?$/i);
    if (chapterMatch?.[1]) {
      snippets.push(chapterMatch[1]);
      continue;
    }

    const routeMatch = line.match(/^Traseu selectat:\s*(.+?)\.?$/i);
    if (routeMatch?.[1]) {
      snippets.push(routeMatch[1]);
      continue;
    }

    const lessonMatch = line.match(/^-\s*(.+?)\s*\(/);
    if (lessonMatch?.[1]) {
      snippets.push(lessonMatch[1]);
    }
  }

  return snippets.slice(0, 8);
}

function getSubjectLabel(subject: InsightAgentSubject) {
  if (subject === 'fizica') return 'Fizică';
  if (subject === 'matematica') return 'Matematică';
  if (subject === 'informatica') return 'Informatică';
  if (subject === 'biologie') return 'Biologie';
  return null;
}

function scoreCandidate(candidate: Candidate, terms: string[], subject: InsightAgentSubject) {
  return scoreCandidateWithPreferences(candidate, terms, subject, {
    requestedKind: 'any',
    requestedKinds: [],
    requestedCounts: {},
    easy: false,
    medium: false,
    advanced: false,
    topicAliases: [],
  });
}

function scoreCandidateWithPreferences(
  candidate: Candidate,
  terms: string[],
  subject: InsightAgentSubject,
  preferences: SearchPreferences
) {
  let score = candidate.baseScore;
  const haystack = normalizeText(candidate.searchable);
  const title = normalizeText(candidate.title);
  const difficulty = normalizeText(candidate.difficulty);

  for (const term of terms) {
    if (title.includes(term)) score += 8;
    else if (haystack.includes(term)) score += 3;
  }

  for (const alias of preferences.topicAliases) {
    const normalizedAlias = normalizeText(alias);
    if (title.includes(normalizedAlias)) score += 9;
    else if (haystack.includes(normalizedAlias)) score += 5;
  }

  const sourceTable =
    typeof candidate.metadata?.source_table === 'string' ? candidate.metadata.source_table : null;
  if (
    (sourceTable === 'learning_path_lessons' || sourceTable === 'fizica_lessons') &&
    preferences.requestedKind === 'problem' &&
    preferences.topicAliases.some((alias) => haystack.includes(normalizeText(alias)))
  ) {
    score += 30;
  }
  if (
    sourceTable === 'fizica_lessons' &&
    preferences.requestedKind === 'lesson' &&
    preferences.topicAliases.some((alias) => haystack.includes(normalizeText(alias)))
  ) {
    score += 40;
  }

  if (subject !== 'general' && normalizeText(candidate.subject).includes(normalizeText(subject))) {
    score += 5;
  }

  if (preferences.requestedKinds.length > 1) {
    if (preferences.requestedKinds.includes('problem') && candidate.type === 'problem') score += 18;
    if (
      preferences.requestedKinds.includes('lesson') &&
      (candidate.type === 'lesson' || candidate.type === 'learning_path' || candidate.type === 'course')
    ) {
      score += 22;
    }
    if (preferences.requestedKinds.includes('quiz') && candidate.type === 'quiz') score += 14;
  } else {
    if (preferences.requestedKind === 'problem') {
      if (candidate.type === 'problem') score += 18;
      if (candidate.type === 'quiz') score += 6;
      if (candidate.type === 'lesson' || candidate.type === 'learning_path') score -= 4;
    } else if (preferences.requestedKind === 'lesson') {
      if (candidate.type === 'lesson' || candidate.type === 'learning_path' || candidate.type === 'course') score += 22;
      if (candidate.type === 'problem' || candidate.type === 'quiz') score -= 18;
    } else if (preferences.requestedKind === 'quiz') {
      if (candidate.type === 'quiz') score += 14;
      if (candidate.type === 'problem') score += 3;
    }
  }

  if (preferences.easy) {
    if (difficulty.includes('initiere')) score += 8;
    if (difficulty.includes('usor')) score += 7;
    if (difficulty.includes('mediu') || difficulty.includes('avansat') || difficulty.includes('concurs') || difficulty.includes('greu')) score -= 3;
  }
  if (preferences.medium && difficulty.includes('mediu')) score += 7;
  if (preferences.advanced) {
    if (difficulty.includes('avansat') || difficulty.includes('concurs') || difficulty.includes('greu')) score += 8;
  }

  return score;
}

function uniqByTypeId(resources: PlanckResourceReference[]) {
  const seen = new Set<string>();
  return resources.filter((resource) => {
    const key = `${resource.type}:${resource.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesRequestedKind(resource: PlanckResourceReference, kind: Exclude<RequestedResourceKind, 'any'>) {
  if (kind === 'problem') return resource.type === 'problem';
  if (kind === 'lesson') return resource.type === 'lesson' || resource.type === 'course' || resource.type === 'learning_path';
  if (kind === 'quiz') return resource.type === 'quiz';
  return false;
}

function selectRequestedBlend(
  resources: PlanckResourceReference[],
  preferences: SearchPreferences,
  limit: number
) {
  if (preferences.requestedKinds.length <= 1) return resources.slice(0, limit);

  const selected: PlanckResourceReference[] = [];
  const selectedKeys = new Set<string>();

  for (const kind of preferences.requestedKinds) {
    const requestedCount = Math.max(1, Math.min(preferences.requestedCounts[kind] ?? 1, limit));
    for (const resource of resources) {
      if (selected.length >= limit) break;
      const key = `${resource.type}:${resource.id}`;
      if (selectedKeys.has(key) || !matchesRequestedKind(resource, kind)) continue;
      selected.push(resource);
      selectedKeys.add(key);
      if (selected.filter((item) => matchesRequestedKind(item, kind)).length >= requestedCount) break;
    }
  }

  for (const resource of resources) {
    if (selected.length >= limit) break;
    const key = `${resource.type}:${resource.id}`;
    if (selectedKeys.has(key)) continue;
    selected.push(resource);
    selectedKeys.add(key);
  }

  return selected;
}

function limitText(value: unknown, max = 160) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Max rows fetched per table before in-memory scoring (keeps Active CPU low on Vercel). */
const CATALOG_QUERY_LIMIT = 40;

async function readTable<T = any>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  configure: (query: any) => any,
  limit = CATALOG_QUERY_LIMIT
): Promise<T[]> {
  try {
    const { data, error } = await configure(supabase.from(table).select(select)).limit(limit);
    if (error) return [];
    return (data || []) as T[];
  } catch {
    return [];
  }
}

function escapeIlikeTerm(term: string): string {
  return term.replace(/[%_,]/g, '');
}

async function readFilteredTable<T = any>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  configure: (query: any) => any,
  terms: string[],
  searchColumns: string[],
  limit = CATALOG_QUERY_LIMIT
): Promise<T[]> {
  const sanitizedTerms = terms.map(escapeIlikeTerm).filter((term) => term.length >= 3).slice(0, 4);

  if (sanitizedTerms.length > 0 && searchColumns.length > 0) {
    for (const term of sanitizedTerms) {
      const orClause = searchColumns.map((col) => `${col}.ilike.%${term}%`).join(',');
      try {
        const { data, error } = await configure(supabase.from(table).select(select).or(orClause)).limit(limit);
        if (!error && data?.length) {
          return data as T[];
        }
      } catch {
        // try next term
      }
    }
  }

  return readTable<T>(supabase, table, select, configure, limit);
}

export async function searchPlanckContentCatalog(
  supabase: SupabaseClient,
  input: SearchInput
): Promise<PlanckResourceReference[]> {
  const terms = extractTerms(input);
  const preferences = inferPreferences(input);
  const subjectLabel = getSubjectLabel(input.intent.subject);
  if ((input.limit ?? 6) <= 0) return [];
  const limit = Math.max(1, Math.min(input.limit ?? 6, 12));

  const catalogStartedAt = Date.now();

  const [
    physicsProblems,
    mathProblems,
    codingProblems,
    quizQuestions,
    fizicaRoutes,
    fizicaChapters,
    fizicaLessons,
    learningPathLessons,
    courseLessons,
  ] = await Promise.all([
    readFilteredTable<any>(
      supabase,
      'problems',
      'id,title,description,statement,difficulty,category,tags,class,created_at',
      (query) => query.order('created_at', { ascending: false }),
      terms,
      ['title', 'description', 'category']
    ),
    readFilteredTable<any>(
      supabase,
      'math_problems',
      'id,title,description,statement,tags,class,difficulty,chapter,created_at',
      (query) => query.eq('is_active', true).order('created_at', { ascending: false }),
      terms,
      ['title', 'description', 'chapter']
    ),
    readFilteredTable<any>(
      supabase,
      'coding_problems',
      'id,slug,title,statement_markdown,difficulty,class,chapter,tags,created_at',
      (query) => query.eq('is_active', true).order('created_at', { ascending: false }),
      terms,
      ['title', 'chapter']
    ),
    readFilteredTable<any>(
      supabase,
      'quiz_questions',
      'id,question_id,class,statement,difficulty,materie,title,description,tags,created_at',
      (query) => query.order('created_at', { ascending: false }),
      terms,
      ['title', 'description']
    ),
    readTable<any>(
      supabase,
      'fizica_routes',
      'id,slug,title,order_index,is_active',
      (query) => query.eq('is_active', true).order('order_index', { ascending: true }),
      50
    ),
    readTable<any>(
      supabase,
      'fizica_chapters',
      'id,route_id,slug,title,order_index,is_active',
      (query) => query.eq('is_active', true).order('order_index', { ascending: true }),
      200
    ),
    readFilteredTable<any>(
      supabase,
      'fizica_lessons',
      'id,chapter_id,title,duration_minutes,lesson_type,order_index,is_active',
      (query) => query.eq('is_active', true).order('order_index', { ascending: true }),
      terms,
      ['title']
    ),
    readFilteredTable<any>(
      supabase,
      'learning_path_lessons',
      'id,slug,title,description,lesson_type,order_index,chapter_id,learning_path_chapters(id,slug,title,description,problem_category)',
      (query) => query.eq('is_active', true).order('order_index', { ascending: true }),
      terms,
      ['title', 'description']
    ),
    readFilteredTable<any>(
      supabase,
      'lessons',
      'id,title,content,difficulty_level,estimated_duration,chapter_id,chapters(id,title,description)',
      (query) => query.eq('is_active', true).order('order_index', { ascending: true }),
      terms,
      ['title']
    ),
  ]);

  const candidates: Candidate[] = [];

  for (const row of physicsProblems) {
    candidates.push({
      type: 'problem',
      id: String(row.id),
      title: row.title || `Problema ${row.id}`,
      subtitle: row.category || (row.class ? `Clasa ${row.class}` : 'Problemă de fizică'),
      subject: 'fizica',
      topic: row.category || null,
      difficulty: row.difficulty || null,
      url: `/probleme/${encodeURIComponent(String(row.id))}`,
      reason: 'Problemă existentă din catalogul Planck.',
      metadata: { class: row.class, source_table: 'problems' },
      searchable: `${row.title} ${row.description} ${row.statement} ${row.category} ${row.tags}`,
      baseScore: input.intent.subject === 'fizica' || preferences.topicAliases.includes('mecanica') ? 8 : 2,
    });
  }

  for (const row of mathProblems) {
    candidates.push({
      type: 'problem',
      id: String(row.id),
      title: row.title || `Problema ${row.id}`,
      subtitle: row.chapter || (row.class ? `Clasa ${row.class}` : 'Problemă de matematică'),
      subject: 'matematica',
      topic: row.chapter || null,
      difficulty: row.difficulty || null,
      url: `/matematica/probleme/${encodeURIComponent(String(row.id))}`,
      reason: 'Problemă existentă din catalogul de matematică Planck.',
      metadata: { class: row.class, source_table: 'math_problems' },
      searchable: `${row.title} ${row.description} ${row.statement} ${(row.tags || []).join(' ')} ${row.chapter}`,
      baseScore: input.intent.subject === 'matematica' ? 8 : 1,
    });
  }

  for (const row of codingProblems) {
    candidates.push({
      type: 'problem',
      id: String(row.id),
      title: row.title || row.slug,
      subtitle: row.chapter || (row.class ? `Clasa ${row.class}` : 'Problemă de informatică'),
      subject: 'informatica',
      topic: row.chapter || null,
      difficulty: row.difficulty || null,
      url: `/informatica/probleme/${encodeURIComponent(String(row.slug))}`,
      reason: 'Problemă existentă din catalogul de informatică Planck.',
      metadata: { class: row.class, slug: row.slug, source_table: 'coding_problems' },
      searchable: `${row.title} ${row.statement_markdown} ${(row.tags || []).join(' ')} ${row.chapter}`,
      baseScore: input.intent.subject === 'informatica' ? 8 : 1,
    });
  }

  for (const row of quizQuestions) {
    const materie = (row.materie || 'fizica') as InsightAgentSubject;
    const questionTitle = row.title || row.description || limitText(row.statement, 80) || row.question_id;
    candidates.push({
      type: 'quiz',
      id: String(row.id),
      title: questionTitle,
      subtitle: `${materie === 'biologie' ? 'Biologie' : 'Fizică'} · Clasa ${row.class}`,
      subject: materie,
      topic: Array.isArray(row.tags) && row.tags.length ? row.tags[0] : null,
      difficulty: row.difficulty ? ['Ușor', 'Mediu', 'Greu'][Number(row.difficulty) - 1] : null,
      url: `/${materie === 'biologie' ? 'biologie/grile' : 'grile'}?question=${encodeURIComponent(String(row.id))}`,
      reason: 'Grilă existentă din catalogul Planck.',
      metadata: { class: row.class, question_id: row.question_id, source_table: 'quiz_questions' },
      searchable: `${row.title} ${row.description} ${row.statement} ${(row.tags || []).join(' ')} ${materie}`,
      baseScore: input.intent.subject === materie ? 7 : 1,
    });
  }

  const fizicaRouteById = new Map(fizicaRoutes.map((route) => [String(route.id), route]));
  const fizicaChapterById = new Map(fizicaChapters.map((chapter) => [String(chapter.id), chapter]));

  for (const row of fizicaLessons) {
    const chapter = fizicaChapterById.get(String(row.chapter_id));
    const route = chapter ? fizicaRouteById.get(String(chapter.route_id)) : null;
    const isPracticeItem = row.lesson_type === 'exerseaza';
    const chapterTitle = chapter?.title || 'Fizică';
    const routeTitle = route?.title || 'Fizică';
    const routeSlug = route?.slug || 'mecanica';
    const chapterSlug = chapter?.slug || row.chapter_id;

    candidates.push({
      type: isPracticeItem ? 'problem' : 'lesson',
      id: String(row.id),
      title: row.title,
      subtitle: chapterTitle,
      subject: 'fizica',
      topic: chapterTitle,
      difficulty: isPracticeItem ? 'Inițiere' : null,
      url: `/invata/fizica?traseu=${encodeURIComponent(String(routeSlug))}&capitol=${encodeURIComponent(String(chapterSlug))}`,
      reason: isPracticeItem
        ? 'Exercițiu existent din harta de fizică Planck.'
        : 'Lecție existentă din harta de fizică Planck.',
      metadata: {
        chapter_id: row.chapter_id,
        chapter_title: chapterTitle,
        route_title: routeTitle,
        lesson_type: row.lesson_type,
        duration_minutes: row.duration_minutes,
        source_table: 'fizica_lessons',
      },
      searchable: `${row.title} ${row.lesson_type} ${chapterTitle} ${routeTitle}`,
      baseScore: isPracticeItem ? 24 : 14,
    });
  }

  for (const row of learningPathLessons) {
    const chapter = Array.isArray(row.learning_path_chapters)
      ? row.learning_path_chapters[0]
      : row.learning_path_chapters;
    const chapterSegment = chapter?.slug || chapter?.id || row.chapter_id;
    const lessonSegment = row.slug || row.id;
    const isPracticeItem = row.lesson_type === 'exerseaza';
    candidates.push({
      type: isPracticeItem ? 'problem' : 'learning_path',
      id: String(row.id),
      title: row.title,
      subtitle: chapter?.title || 'Traseu de învățare',
      subject: subjectLabel,
      topic: chapter?.title || chapter?.problem_category || null,
      difficulty: isPracticeItem ? 'Inițiere' : null,
      url: `/invata/${encodeURIComponent(String(chapterSegment))}/${encodeURIComponent(String(lessonSegment))}`,
      reason: isPracticeItem
        ? 'Exercițiu existent din traseul curent Planck.'
        : 'Lecție existentă din traseele Planck.',
      metadata: { chapter_id: row.chapter_id, chapter_title: chapter?.title, lesson_type: row.lesson_type, source_table: 'learning_path_lessons' },
      searchable: `${row.title} ${row.description} ${row.lesson_type} ${chapter?.title} ${chapter?.description} ${chapter?.problem_category}`,
      baseScore: isPracticeItem ? 9 : 5,
    });
  }

  for (const row of courseLessons) {
    const chapter = Array.isArray(row.chapters) ? row.chapters[0] : row.chapters;
    candidates.push({
      type: 'lesson',
      id: String(row.id),
      title: row.title,
      subtitle: chapter?.title || 'Lecție Planck',
      subject: 'fizica',
      topic: chapter?.title || null,
      difficulty: row.difficulty_level ? `Nivel ${row.difficulty_level}` : null,
      url: `/cursuri/${slugify(row.title)}`,
      reason: 'Lecție existentă din biblioteca Planck.',
      metadata: { chapter_id: row.chapter_id, estimated_duration: row.estimated_duration, source_table: 'lessons' },
      searchable: `${row.title} ${limitText(row.content, 2000)} ${chapter?.title} ${chapter?.description}`,
      baseScore: input.intent.subject === 'fizica' ? 7 : 2,
    });
  }

  const ranked = candidates
    .map((candidate) => ({ candidate, score: scoreCandidateWithPreferences(candidate, terms, input.intent.subject, preferences) }))
    .filter(({ score }) => score > 0 || terms.length === 0 || preferences.requestedKind !== 'any')
    .sort((a, b) => b.score - a.score)
    .map(({ candidate }) => {
      const { searchable: _searchable, baseScore: _baseScore, ...resource } = candidate;
      return resource;
    });

  const results = selectRequestedBlend(uniqByTypeId(ranked), preferences, limit);

  if (process.env.NODE_ENV !== 'test') {
    const candidateCount =
      physicsProblems.length +
      mathProblems.length +
      codingProblems.length +
      quizQuestions.length +
      fizicaLessons.length +
      learningPathLessons.length +
      courseLessons.length;
    console.info(
      `[insight.catalog] ${Date.now() - catalogStartedAt}ms terms=${terms.length} candidates=${candidateCount} results=${results.length}`
    );
  }

  return results;
}
