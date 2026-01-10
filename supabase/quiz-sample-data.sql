-- Sample Quiz Questions for Testing
-- Run this script in Supabase SQL Editor to populate test data

-- ==========================================
-- CLASA A IX-A (Mecanică, Termodinamică)
-- ==========================================

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES
(
  'FIZ-IX-001',
  9,
  'Care este unitatea de măsură pentru forță în Sistemul Internațional (SI)?',
  1,
  '{"A": "Kilogram (kg)", "B": "Newton (N)", "C": "Joule (J)", "D": "Watt (W)", "E": "Pascal (Pa)", "F": "Metru (m)"}'::jsonb,
  'B'
),
(
  'FIZ-IX-002',
  9,
  'Un corp se deplasează cu viteza constantă $v = 20 \, \text{m/s}$. Ce distanță parcurge în $t = 5 \, \text{s}$?',
  1,
  '{"A": "$25 \\, \\text{m}$", "B": "$4 \\, \\text{m}$", "C": "$100 \\, \\text{m}$", "D": "$15 \\, \\text{m}$", "E": "$50 \\, \\text{m}$", "F": "$200 \\, \\text{m}$"}'::jsonb,
  'C'
),
(
  'FIZ-IX-003',
  9,
  'Care este expresia corectă a legii a II-a a lui Newton?',
  2,
  '{"A": "$F = m \\cdot v$", "B": "$F = m \\cdot a$", "C": "$F = m \\cdot g$", "D": "$F = \\frac{m}{a}$", "E": "$a = F \\cdot m$", "F": "$F = \\frac{a}{m}$"}'::jsonb,
  'B'
),
(
  'FIZ-IX-004',
  9,
  'Un corp cu masa $m = 2 \, \text{kg}$ este accelerat cu $a = 3 \, \text{m/s}^2$. Care este forța care acționează asupra lui?',
  2,
  '{"A": "$1.5 \\, \\text{N}$", "B": "$5 \\, \\text{N}$", "C": "$6 \\, \\text{N}$", "D": "$0.67 \\, \\text{N}$", "E": "$9 \\, \\text{N}$", "F": "$12 \\, \\text{N}$"}'::jsonb,
  'C'
),
(
  'FIZ-IX-005',
  9,
  'Care este energia cinetică a unui corp cu masa $m = 4 \, \text{kg}$ care se mișcă cu viteza $v = 5 \, \text{m/s}$? Formula: $E_c = \frac{1}{2}mv^2$',
  3,
  '{"A": "$20 \\, \\text{J}$", "B": "$10 \\, \\text{J}$", "C": "$50 \\, \\text{J}$", "D": "$100 \\, \\text{J}$", "E": "$40 \\, \\text{J}$", "F": "$25 \\, \\text{J}$"}'::jsonb,
  'C'
);

-- ==========================================
-- CLASA A X-A (Optică, Electricitate)
-- ==========================================

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES
(
  'FIZ-X-001',
  10,
  'Care este legea lui Ohm pentru o porțiune de circuit?',
  1,
  '{"A": "$U = R \\cdot I$", "B": "$U = \\frac{R}{I}$", "C": "$I = U \\cdot R$", "D": "$R = U \\cdot I$", "E": "$P = U \\cdot I$", "F": "$U = I^2 \\cdot R$"}'::jsonb,
  'A'
),
(
  'FIZ-X-002',
  10,
  'Prin ce se caracterizează fenomenul de reflexie totală a luminii?',
  2,
  '{"A": "Lumina trece din mediul mai dens în cel mai puțin dens", "B": "Lumina trece din mediul mai puțin dens în cel mai dens", "C": "Unghiul de incidență este mai mic decât unghiul limită", "D": "Toată lumina este reflectată înapoi în primul mediu", "E": "Lumina se dispersează în mai multe culori", "F": "Lumina este complet absorbită"}'::jsonb,
  'D'
),
(
  'FIZ-X-003',
  10,
  'Un rezistor cu $R = 10 \, \Omega$ este parcurs de un curent $I = 2 \, \text{A}$. Care este tensiunea la bornele rezistorului?',
  1,
  '{"A": "$5 \\, \\text{V}$", "B": "$20 \\, \\text{V}$", "C": "$12 \\, \\text{V}$", "D": "$8 \\, \\text{V}$", "E": "$0.2 \\, \\text{V}$", "F": "$40 \\, \\text{V}$"}'::jsonb,
  'B'
),
(
  'FIZ-X-004',
  10,
  'Care este puterea disipată de un bec cu rezistența $R = 100 \, \Omega$ conectat la tensiunea $U = 220 \, \text{V}$? Formula: $P = \frac{U^2}{R}$',
  3,
  '{"A": "$2.2 \\, \\text{W}$", "B": "$22 \\, \\text{W}$", "C": "$484 \\, \\text{W}$", "D": "$220 \\, \\text{W}$", "E": "$48400 \\, \\text{W}$", "F": "$4.84 \\, \\text{W}$"}'::jsonb,
  'C'
);

-- ==========================================
-- CLASA A XI-A (Electrodinamică, Oscilații)
-- ==========================================

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES
(
  'FIZ-XI-001',
  11,
  'Care este perioada de oscilație a unui pendul simplu cu lungimea $l = 1 \, \text{m}$? Se dă $g = 10 \, \text{m/s}^2$ și formula $T = 2\pi\sqrt{\frac{l}{g}}$',
  2,
  '{"A": "$T \\approx 1 \\, \\text{s}$", "B": "$T \\approx 2 \\, \\text{s}$", "C": "$T \\approx 3.14 \\, \\text{s}$", "D": "$T \\approx 6.28 \\, \\text{s}$", "E": "$T \\approx 0.5 \\, \\text{s}$", "F": "$T \\approx 10 \\, \\text{s}$"}'::jsonb,
  'B'
),
(
  'FIZ-XI-002',
  11,
  'Care este expresia forței electrostatice dintre două sarcini punctiforme $q_1$ și $q_2$ aflate la distanța $r$?',
  1,
  '{"A": "$F = k \\frac{q_1 q_2}{r}$", "B": "$F = k \\frac{q_1 q_2}{r^2}$", "C": "$F = k \\frac{q_1 + q_2}{r^2}$", "D": "$F = k \\cdot q_1 \\cdot q_2 \\cdot r^2$", "E": "$F = \\frac{q_1 q_2}{4\\pi\\varepsilon_0 r}$", "F": "$F = k \\frac{q_1 q_2}{r^3}$"}'::jsonb,
  'B'
),
(
  'FIZ-XI-003',
  11,
  'Ce reprezintă constanta de timp $\tau$ într-un circuit RC?',
  2,
  '{"A": "$\\tau = R + C$", "B": "$\\tau = \\frac{R}{C}$", "C": "$\\tau = R \\cdot C$", "D": "$\\tau = \\frac{C}{R}$", "E": "$\\tau = \\sqrt{RC}$", "F": "$\\tau = \\frac{1}{RC}$"}'::jsonb,
  'C'
);

-- ==========================================
-- CLASA A XII-A (Fizică atomică, nucleară)
-- ==========================================

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES
(
  'FIZ-XII-001',
  12,
  'Care este relația lui Einstein pentru energia unui foton cu frecvența $\nu$?',
  1,
  '{"A": "$E = mc^2$", "B": "$E = h\\nu$", "C": "$E = \\frac{hc}{\\nu}$", "D": "$E = h\\lambda$", "E": "$E = \\frac{1}{2}mv^2$", "F": "$E = p \\cdot c$"}'::jsonb,
  'B'
),
(
  'FIZ-XII-002',
  12,
  'Ce este efectul fotoelectric?',
  1,
  '{"A": "Emisia de lumină de către un corp încălzit", "B": "Emisia de electroni de către o suprafață metalică iluminată", "C": "Reflexia luminii pe o suprafață metalică", "D": "Absorbția luminii în materiale transparente", "E": "Difracția luminii prin fante înguste", "F": "Polarizarea luminii"}'::jsonb,
  'B'
),
(
  'FIZ-XII-003',
  12,
  'În dezintegrarea $\beta^-$, ce particulă este emisă din nucleu?',
  2,
  '{"A": "Proton", "B": "Neutron", "C": "$\\alpha$ (nucleu de heliu)", "D": "Electron și antineutrino", "E": "Pozitron și neutrino", "F": "Foton $\\gamma$"}'::jsonb,
  'D'
),
(
  'FIZ-XII-004',
  12,
  'Care este lungimea de undă de Broglie a unui electron cu impulsul $p$? Se dă constanta lui Planck $h$.',
  3,
  '{"A": "$\\lambda = h \\cdot p$", "B": "$\\lambda = \\frac{p}{h}$", "C": "$\\lambda = \\frac{h}{p}$", "D": "$\\lambda = \\frac{h}{mc}$", "E": "$\\lambda = \\sqrt{\\frac{h}{p}}$", "F": "$\\lambda = h \\cdot p^2$"}'::jsonb,
  'C'
);
