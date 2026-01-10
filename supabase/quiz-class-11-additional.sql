-- ==========================================
-- GRILE ADIȚIONALE - CLASA A XI-A
-- Fizică pentru admitere și antrenament
-- 20 întrebări noi (FIZ-XI-004 până la FIZ-XI-023)
-- ==========================================

-- Teme acoperite:
-- - Electrostatică (Legea lui Coulomb, câmp electric, potențial)
-- - Condensatori (capacitate, energie, grupări)
-- - Curent electric (intensitate, rezistență, legi Kirchhoff)
-- - Oscilații și unde mecanice
-- - Curent alternativ (circuit RLC)
-- - Inducție electromagnetică

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES

-- ==========================================
-- ELECTROSTATICĂ
-- ==========================================

(
  'FIZ-XI-004',
  11,
  'Două sarcini punctiforme egale $q_1 = q_2 = 4 \, \mu\text{C}$ sunt plasate la distanța $r = 2 \, \text{m}$. Care este forța de interacțiune dintre ele? Se dă $k = 9 \cdot 10^9 \, \text{N} \cdot \text{m}^2/\text{C}^2$.',
  2,
  '{"A": "$0.36 \\, \\text{N}$", "B": "$0.036 \\, \\text{N}$", "C": "$3.6 \\, \\text{N}$", "D": "$0.018 \\, \\text{N}$", "E": "$36 \\, \\text{N}$", "F": "$0.0036 \\, \\text{N}$"}'::jsonb,
  'B'
),

(
  'FIZ-XI-005',
  11,
  'Care este intensitatea câmpului electric creat de o sarcină punctiformă $Q = 2 \, \mu\text{C}$ la distanța $r = 1 \, \text{m}$? Se dă $k = 9 \cdot 10^9 \, \text{N} \cdot \text{m}^2/\text{C}^2$.',
  2,
  '{"A": "$E = 1.8 \\cdot 10^4 \\, \\text{N/C}$", "B": "$E = 1.8 \\cdot 10^3 \\, \\text{N/C}$", "C": "$E = 1.8 \\cdot 10^5 \\, \\text{N/C}$", "D": "$E = 9 \\cdot 10^3 \\, \\text{N/C}$", "E": "$E = 4.5 \\cdot 10^3 \\, \\text{N/C}$", "F": "$E = 3.6 \\cdot 10^4 \\, \\text{N/C}$"}'::jsonb,
  'A'
),

(
  'FIZ-XI-006',
  11,
  'Care este relația dintre intensitatea câmpului electric $E$ și potențialul electric $V$ într-un câmp uniform?',
  1,
  '{"A": "$E = V \\cdot d$", "B": "$E = \\frac{d}{V}$", "C": "$E = \\frac{V}{d}$", "D": "$V = E \\cdot d^2$", "E": "$E = V^2 \\cdot d$", "F": "$E = \\sqrt{\\frac{V}{d}}$"}'::jsonb,
  'C'
),

(
  'FIZ-XI-007',
  11,
  'Care este lucrul mecanic efectuat pentru a deplasa o sarcină $q = 5 \, \mu\text{C}$ între două puncte cu diferența de potențial $U = 100 \, \text{V}$?',
  1,
  '{"A": "$L = 5 \\cdot 10^{-4} \\, \\text{J}$", "B": "$L = 5 \\cdot 10^{-3} \\, \\text{J}$", "C": "$L = 0.5 \\, \\text{J}$", "D": "$L = 5 \\cdot 10^{-2} \\, \\text{J}$", "E": "$L = 20 \\, \\text{J}$", "F": "$L = 2 \\cdot 10^{-5} \\, \\text{J}$"}'::jsonb,
  'A'
),

-- ==========================================
-- CONDENSATORI
-- ==========================================

(
  'FIZ-XI-008',
  11,
  'Care este capacitatea echivalentă a două condensatoare cu $C_1 = 4 \, \mu\text{F}$ și $C_2 = 6 \, \mu\text{F}$ conectate în serie?',
  2,
  '{"A": "$C = 10 \\, \\mu\\text{F}$", "B": "$C = 2 \\, \\mu\\text{F}$", "C": "$C = 2.4 \\, \\mu\\text{F}$", "D": "$C = 5 \\, \\mu\\text{F}$", "E": "$C = 1.5 \\, \\mu\\text{F}$", "F": "$C = 24 \\, \\mu\\text{F}$"}'::jsonb,
  'C'
),

(
  'FIZ-XI-009',
  11,
  'Un condensator cu capacitatea $C = 10 \, \mu\text{F}$ este încărcat la tensiunea $U = 200 \, \text{V}$. Care este energia stocată în condensator? Formula: $W = \frac{1}{2}CU^2$',
  2,
  '{"A": "$W = 0.2 \\, \\text{J}$", "B": "$W = 2 \\, \\text{J}$", "C": "$W = 0.02 \\, \\text{J}$", "D": "$W = 20 \\, \\text{J}$", "E": "$W = 0.4 \\, \\text{J}$", "F": "$W = 4 \\, \\text{mJ}$"}'::jsonb,
  'A'
),

(
  'FIZ-XI-010',
  11,
  'Care este sarcina pe un condensator cu capacitatea $C = 50 \, \mu\text{F}$ încărcat la tensiunea $U = 12 \, \text{V}$?',
  1,
  '{"A": "$Q = 600 \\, \\mu\\text{C}$", "B": "$Q = 60 \\, \\mu\\text{C}$", "C": "$Q = 6 \\, \\text{mC}$", "D": "$Q = 0.6 \\, \\text{C}$", "E": "$Q = 4.17 \\, \\mu\\text{C}$", "F": "$Q = 62 \\, \\mu\\text{C}$"}'::jsonb,
  'A'
),

(
  'FIZ-XI-011',
  11,
  'Cum se modifică capacitatea unui condensator plan dacă distanța dintre plăci se dublează, păstrând celelalte condiții constante?',
  2,
  '{"A": "Se dublează", "B": "Se înjumătățește", "C": "Rămâne constantă", "D": "Se triplează", "E": "Devine de 4 ori mai mică", "F": "Devine de 4 ori mai mare"}'::jsonb,
  'B'
),

-- ==========================================
-- CURENT ELECTRIC
-- ==========================================

(
  'FIZ-XI-012',
  11,
  'Care este rezistența echivalentă a trei rezistoare de $6 \, \Omega$ conectate în paralel?',
  2,
  '{"A": "$R = 18 \\, \\Omega$", "B": "$R = 6 \\, \\Omega$", "C": "$R = 2 \\, \\Omega$", "D": "$R = 3 \\, \\Omega$", "E": "$R = 9 \\, \\Omega$", "F": "$R = 1 \\, \\Omega$"}'::jsonb,
  'C'
),

(
  'FIZ-XI-013',
  11,
  'O baterie cu f.e.m. $\mathcal{E} = 12 \, \text{V}$ și rezistență internă $r = 1 \, \Omega$ alimentează un rezistor $R = 5 \, \Omega$. Care este intensitatea curentului în circuit?',
  2,
  '{"A": "$I = 2.4 \\, \\text{A}$", "B": "$I = 12 \\, \\text{A}$", "C": "$I = 2 \\, \\text{A}$", "D": "$I = 6 \\, \\text{A}$", "E": "$I = 1.5 \\, \\text{A}$", "F": "$I = 3 \\, \\text{A}$"}'::jsonb,
  'C'
),

(
  'FIZ-XI-014',
  11,
  'Care este enunțul corect al primei legi a lui Kirchhoff?',
  1,
  '{"A": "Suma algebrică a tensiunilor într-o buclă este zero", "B": "Suma algebrică a curenților într-un nod este zero", "C": "Puterea totală în circuit este constantă", "D": "Rezistența totală este suma rezistențelor", "E": "Curentul prin toate elementele în serie este diferit", "F": "Tensiunea la bornele circuitului este maximă"}'::jsonb,
  'B'
),

(
  'FIZ-XI-015',
  11,
  'Care este puterea disipată pe un rezistor $R = 50 \, \Omega$ parcurs de curentul $I = 2 \, \text{A}$?',
  1,
  '{"A": "$P = 100 \\, \\text{W}$", "B": "$P = 200 \\, \\text{W}$", "C": "$P = 25 \\, \\text{W}$", "D": "$P = 400 \\, \\text{W}$", "E": "$P = 50 \\, \\text{W}$", "F": "$P = 150 \\, \\text{W}$"}'::jsonb,
  'B'
),

-- ==========================================
-- OSCILAȚII ȘI UNDE MECANICE
-- ==========================================

(
  'FIZ-XI-016',
  11,
  'Care este frecvența de oscilație a unui sistem arc-corp cu constanta elastică $k = 100 \, \text{N/m}$ și masa corpului $m = 1 \, \text{kg}$? Formula: $f = \frac{1}{2\pi}\sqrt{\frac{k}{m}}$',
  3,
  '{"A": "$f \\approx 1.59 \\, \\text{Hz}$", "B": "$f \\approx 10 \\, \\text{Hz}$", "C": "$f \\approx 0.159 \\, \\text{Hz}$", "D": "$f \\approx 5 \\, \\text{Hz}$", "E": "$f \\approx 3.14 \\, \\text{Hz}$", "F": "$f \\approx 0.5 \\, \\text{Hz}$"}'::jsonb,
  'A'
),

(
  'FIZ-XI-017',
  11,
  'Care este relația dintre viteza $v$, frecvența $f$ și lungimea de undă $\lambda$ pentru o undă mecanică?',
  1,
  '{"A": "$v = f + \\lambda$", "B": "$v = \\frac{f}{\\lambda}$", "C": "$v = f \\cdot \\lambda$", "D": "$v = \\frac{\\lambda}{f}$", "E": "$v = f^2 \\cdot \\lambda$", "F": "$v = \\sqrt{f \\cdot \\lambda}$"}'::jsonb,
  'C'
),

(
  'FIZ-XI-018',
  11,
  'O undă sonoră are frecvența $f = 440 \, \text{Hz}$ și se propagă cu viteza $v = 340 \, \text{m/s}$. Care este lungimea de undă?',
  2,
  '{"A": "$\\lambda \\approx 0.77 \\, \\text{m}$", "B": "$\\lambda \\approx 1.29 \\, \\text{m}$", "C": "$\\lambda \\approx 7.7 \\, \\text{m}$", "D": "$\\lambda \\approx 0.23 \\, \\text{m}$", "E": "$\\lambda = 100 \\, \\text{m}$", "F": "$\\lambda \\approx 149600 \\, \\text{m}$"}'::jsonb,
  'A'
),

(
  'FIZ-XI-019',
  11,
  'Pentru oscilații armonice, cum variază energia cinetică în raport cu deplasarea $x$ față de poziția de echilibru?',
  3,
  '{"A": "Crește liniar cu x", "B": "Este maximă la amplitudine maximă", "C": "Este maximă la poziția de echilibru și zero la amplitudine maximă", "D": "Este constantă", "E": "Este zero la poziția de echilibru", "F": "Variază sinusoidal cu perioada T/4"}'::jsonb,
  'C'
),

-- ==========================================
-- CURENT ALTERNATIV ȘI CIRCUITE RLC
-- ==========================================

(
  'FIZ-XI-020',
  11,
  'Care este reactanța inductivă a unei bobine cu inductanța $L = 0.1 \, \text{H}$ la frecvența $f = 50 \, \text{Hz}$? Formula: $X_L = 2\pi f L$',
  2,
  '{"A": "$X_L \\approx 31.4 \\, \\Omega$", "B": "$X_L \\approx 5 \\, \\Omega$", "C": "$X_L \\approx 314 \\, \\Omega$", "D": "$X_L \\approx 15.7 \\, \\Omega$", "E": "$X_L \\approx 50 \\, \\Omega$", "F": "$X_L \\approx 100 \\, \\Omega$"}'::jsonb,
  'A'
),

(
  'FIZ-XI-021',
  11,
  'Care este reactanța capacitivă a unui condensator cu $C = 100 \, \mu\text{F}$ la frecvența $f = 50 \, \text{Hz}$? Formula: $X_C = \frac{1}{2\pi f C}$',
  2,
  '{"A": "$X_C \\approx 31.8 \\, \\Omega$", "B": "$X_C \\approx 318 \\, \\Omega$", "C": "$X_C \\approx 3.18 \\, \\Omega$", "D": "$X_C \\approx 100 \\, \\Omega$", "E": "$X_C \\approx 50 \\, \\Omega$", "F": "$X_C \\approx 15.9 \\, \\Omega$"}'::jsonb,
  'A'
),

(
  'FIZ-XI-022',
  11,
  'La ce condiție apare rezonanța într-un circuit RLC serie?',
  2,
  '{"A": "Când $R = 0$", "B": "Când $X_L = X_C$", "C": "Când $X_L > X_C$", "D": "Când $X_L < X_C$", "E": "Când $R = X_L + X_C$", "F": "Când frecvența tinde la infinit"}'::jsonb,
  'B'
),

-- ==========================================
-- INDUCȚIE ELECTROMAGNETICĂ
-- ==========================================

(
  'FIZ-XI-023',
  11,
  'Care este expresia legii inducției electromagnetice (Legea lui Faraday)? Se notează fluxul magnetic cu $\Phi$.',
  3,
  '{"A": "$e = B \\cdot A$", "B": "$e = -\\frac{d\\Phi}{dt}$", "C": "$e = B \\cdot I$", "D": "$e = \\frac{\\Phi}{t}$", "E": "$e = L \\cdot I$", "F": "$e = \\Phi \\cdot \\omega$"}'::jsonb,
  'B'
);

-- Verificare: Această comandă va afișa numărul de grile pentru clasa a XI-a
-- SELECT COUNT(*) as total_grile_clasa_11 FROM quiz_questions WHERE class = 11;
