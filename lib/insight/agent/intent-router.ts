import type { InsightAgentIntent, InsightAgentSubject } from './types';

const SUBJECT_PATTERNS: Array<[InsightAgentSubject, RegExp]> = [
  ['fizica', /\b(fizic[ăa]|mecanic[ăa]|macanic[ăa]|electricitate|optic[ăa]|termodinamic[ăa]|circuit|for[țt][ăa]|energie|putere|ohm|kirchhoff)\b/i],
  ['matematica', /\b(matematic[ăa]|algebr[ăa]|geometrie|analiz[ăa]|func[țt]ii|ecua[țt]ii|integral[ăa]|derivat[ăa])\b/i],
  ['informatica', /\b(informatic[ăa]|programare|algoritm|c\+\+|python|cod|vector|graf|dfs|bfs|dinamic[ăa])\b/i],
  ['biologie', /\b(biologie|celul[ăa]|genetic[ăa]|anatomie|organism|ADN|ecosistem)\b/i],
];

const TOPIC_HINTS: Array<[string, RegExp]> = [
  ['circuite electrice', /\b(circuit|ohm|kirchhoff|rezistor|tensiune|curent electric)\b/i],
  ['mecanică', /\b(mecanic[ăa]|macanic[ăa]|for[țt][ăa]|accelera[țt]ie|vitez[ăa]|energie cinetic[ăa])\b/i],
  ['funcții', /\b(func[țt]ii|grafic|domeniu|codomeniu)\b/i],
  ['algoritmi', /\b(algoritm|complexitate|dfs|bfs|programare dinamic[ăa])\b/i],
  ['genetică', /\b(genetic[ăa]|ADN|ARN|cromozom)\b/i],
];

function detectSubject(input: string): InsightAgentSubject {
  return SUBJECT_PATTERNS.find(([, pattern]) => pattern.test(input))?.[0] ?? 'general';
}

function detectTopic(input: string): string | null {
  return TOPIC_HINTS.find(([, pattern]) => pattern.test(input))?.[0] ?? null;
}

export function resolveInsightAgentIntent(input: string): InsightAgentIntent {
  const normalized = input.trim();
  const reasons: string[] = [];
  const subject = detectSubject(normalized);
  const topic = detectTopic(normalized);

  const wantsPlan = /\b(plan|program|calendar|strategie|înva[țt]|inv[aă][țt]|preg[aă]te[sș]te|recapitulare|test|bac|examen|olimpiad[ăa])\b/i.test(normalized);
  const feelsLost = /\b(nu [șs]tiu de unde|pierdut|sunt praf|nu [îi]n[țt]eleg nimic|unde (s[ăa] )?[îi]ncep)\b/i.test(normalized);
  const wantsRecommendation = /\b(recomand[ăa]|ce curs|curs potrivit|lec[țt]ie potrivit[ăa]|ce ar trebui s[ăa] fac|urm[ăa]torul pas|probleme|problem[ăa]|exerci[țt]ii|practic[ăa]|antrenament)\b/i.test(normalized);
  const wantsParent = /\b(p[aă]rinte|p[aă]rin[țt]i|mama|tata|raport|rezumat progres|trimite.*progres)\b/i.test(normalized);

  if (wantsParent) {
    reasons.push('parent-progress language detected');
    return { type: 'parent_report', subject, topic, confidence: 0.86, reasons };
  }
  if (wantsRecommendation) {
    reasons.push('recommendation language detected');
    return { type: 'recommendation', subject, topic, confidence: 0.82, reasons };
  }
  if (wantsPlan) {
    reasons.push('planning/preparation language detected');
    return { type: 'plan', subject, topic, confidence: 0.84, reasons };
  }
  if (feelsLost) {
    reasons.push('student reports being lost or unsure where to start');
    return { type: 'diagnosis', subject, topic, confidence: 0.8, reasons };
  }

  return { type: 'tutor', subject, topic, confidence: 0.65, reasons: ['default tutor intent'] };
}
