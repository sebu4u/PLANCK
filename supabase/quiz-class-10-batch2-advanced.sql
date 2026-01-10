-- ==========================================
-- GRILE FOARTE DIFICILE - CLASA A X-A (BATCH 2)
-- Probleme de nivel admitere grea
-- 20 întrebări (FIZ-X-025 până la FIZ-X-044)
-- ==========================================

-- Teme acoperite:
-- - Probleme complexe cu gaze ideale
-- - Cicluri termodinamice avansate (Carnot, Otto, Diesel)
-- - Teoria cinetică avansată
-- - Transformări combinate și diagrame p-V
-- - Procese politropice
-- - Schimburi de căldură cu schimbări de fază multiple

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES

-- ==========================================
-- CICLURI TERMODINAMICE AVANSATE
-- ==========================================

(
  'FIZ-X-025',
  10,
  'Un motor Carnot funcționează între temperaturile $T_1 = 627°\text{C}$ și $T_2 = 27°\text{C}$. Dacă motorul primește de la sursa caldă căldura $Q_1 = 900 \, \text{J}$, care este lucrul mecanic efectuat într-un ciclu?',
  3,
  '{"A": "$L = 600 \\, \\text{J}$", "B": "$L = 300 \\, \\text{J}$", "C": "$L = 450 \\, \\text{J}$", "D": "$L = 540 \\, \\text{J}$", "E": "$L = 720 \\, \\text{J}$", "F": "$L = 810 \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-026',
  10,
  'Un ciclu Otto ideal are raportul de compresie $r = V_1/V_2 = 8$ și lucrează cu aer ($\gamma = 1.4$). Care este randamentul termic al ciclului? Se dă $8^{0.4} \approx 2.3$.',
  3,
  '{"A": "$\\eta \\approx 56.5\\%$", "B": "$\\eta \\approx 43.5\\%$", "C": "$\\eta \\approx 65\\%$", "D": "$\\eta \\approx 75\\%$", "E": "$\\eta \\approx 50\\%$", "F": "$\\eta \\approx 87.5\\%$"}'::jsonb,
  'A'
),

(
  'FIZ-X-027',
  10,
  'Un gaz ideal monoatomic parcurge un ciclu format din: o expansiune izotermă (1-2), o compresie izobară (2-3) și o încălzire izocoră (3-1). Dacă în starea 1 avem $p_1 = 4 \times 10^5 \, \text{Pa}$, $V_1 = 2 \, \text{L}$, iar în starea 2 avem $V_2 = 4 \, \text{L}$, care este lucrul mecanic în transformarea izotermă? Se dă $\ln 2 \approx 0.693$.',
  3,
  '{"A": "$L_{12} \\approx 554 \\, \\text{J}$", "B": "$L_{12} = 800 \\, \\text{J}$", "C": "$L_{12} \\approx 400 \\, \\text{J}$", "D": "$L_{12} \\approx 693 \\, \\text{J}$", "E": "$L_{12} \\approx 277 \\, \\text{J}$", "F": "$L_{12} = 1000 \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-028',
  10,
  'Un gaz ideal diatomic ($\gamma = 1.4$) parcurge un ciclu Diesel cu raportul de compresie $r = 16$ și raportul de injecție $\rho = 2$. Care este randamentul ciclului? Se dă: $16^{0.4} \approx 3.03$, $2^{1.4} \approx 2.64$.',
  3,
  '{"A": "$\\eta \\approx 61\\%$", "B": "$\\eta \\approx 55\\%$", "C": "$\\eta \\approx 70\\%$", "D": "$\\eta \\approx 48\\%$", "E": "$\\eta \\approx 75\\%$", "F": "$\\eta \\approx 67\\%$"}'::jsonb,
  'A'
),

-- ==========================================
-- TEORIA CINETICĂ AVANSATĂ
-- ==========================================

(
  'FIZ-X-029',
  10,
  'Într-un recipient de volum $V = 22.4 \, \text{L}$ se află $N = 6.02 \times 10^{23}$ molecule de gaz ideal la temperatura $T = 273 \, \text{K}$. Care este presiunea gazului? Se dă $k_B = 1.38 \times 10^{-23} \, \text{J/K}$.',
  3,
  '{"A": "$p \\approx 10^5 \\, \\text{Pa}$", "B": "$p \\approx 2 \\times 10^5 \\, \\text{Pa}$", "C": "$p \\approx 0.5 \\times 10^5 \\, \\text{Pa}$", "D": "$p \\approx 10^4 \\, \\text{Pa}$", "E": "$p \\approx 10^6 \\, \\text{Pa}$", "F": "$p \\approx 2.27 \\times 10^5 \\, \\text{Pa}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-030',
  10,
  'Un amestec echimolar de hidrogen ($M_1 = 2 \, \text{g/mol}$) și oxigen ($M_2 = 32 \, \text{g/mol}$) se află la temperatura $T$. Care este raportul vitezelor medii pătratice $v_{H_2}/v_{O_2}$?',
  3,
  '{"A": "$v_{H_2}/v_{O_2} = 4$", "B": "$v_{H_2}/v_{O_2} = 16$", "C": "$v_{H_2}/v_{O_2} = 2$", "D": "$v_{H_2}/v_{O_2} = 8$", "E": "$v_{H_2}/v_{O_2} = \\sqrt{2}$", "F": "$v_{H_2}/v_{O_2} = 1$"}'::jsonb,
  'A'
),

(
  'FIZ-X-031',
  10,
  'Un gaz ideal monoatomic are energia internă $U = 3000 \, \text{J}$ și conține $n = 2 \, \text{mol}$. Care este temperatura gazului? Se dă $R = 8.31 \, \text{J/(mol} \cdot \text{K)}$.',
  3,
  '{"A": "$T \\approx 120 \\, \\text{K}$", "B": "$T \\approx 240 \\, \\text{K}$", "C": "$T \\approx 180 \\, \\text{K}$", "D": "$T \\approx 360 \\, \\text{K}$", "E": "$T \\approx 80 \\, \\text{K}$", "F": "$T \\approx 300 \\, \\text{K}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-032',
  10,
  'Presiunea unui gaz ideal crește de 4 ori, iar volumul se reduce la jumătate. Cu ce factor se modifică energia cinetică medie a unei molecule?',
  3,
  '{"A": "$E_c$ crește de 2 ori", "B": "$E_c$ rămâne constantă", "C": "$E_c$ crește de 4 ori", "D": "$E_c$ scade de 2 ori", "E": "$E_c$ crește de 8 ori", "F": "$E_c$ scade de 4 ori"}'::jsonb,
  'A'
),

-- ==========================================
-- PROCESE POLITROPICE ȘI TRANSFORMĂRI COMPLEXE
-- ==========================================

(
  'FIZ-X-033',
  10,
  'Un gaz ideal monoatomic suferă o transformare în care $pV^{3/2} = \text{const}$. Care este căldura molară $C$ a acestui proces? Se dă $C_V = 3R/2$ pentru gaz monoatomic.',
  3,
  '{"A": "$C = 0$", "B": "$C = R/2$", "C": "$C = R$", "D": "$C = 3R/2$", "E": "$C = -R$", "F": "$C = 2R$"}'::jsonb,
  'A'
),

(
  'FIZ-X-034',
  10,
  'Un gaz ideal parcurge o transformare de la starea $(p_1, V_1, T_1)$ la starea $(p_2, V_2, T_2)$ astfel încât $p_1 = 10^5 \, \text{Pa}$, $p_2 = 4 \times 10^5 \, \text{Pa}$, $V_1 = 8 \, \text{L}$, $V_2 = 4 \, \text{L}$. Care este raportul $T_2/T_1$?',
  3,
  '{"A": "$T_2/T_1 = 2$", "B": "$T_2/T_1 = 4$", "C": "$T_2/T_1 = 1/2$", "D": "$T_2/T_1 = 1$", "E": "$T_2/T_1 = 8$", "F": "$T_2/T_1 = 1/4$"}'::jsonb,
  'A'
),

(
  'FIZ-X-035',
  10,
  'Un gaz ideal diatomic ($C_V = 5R/2$) primește căldura $Q = 700 \, \text{J}$ într-o transformare în care presiunea crește proporțional cu volumul ($p = \alpha V$). Care este lucrul mecanic efectuat de gaz?',
  3,
  '{"A": "$L = 200 \\, \\text{J}$", "B": "$L = 350 \\, \\text{J}$", "C": "$L = 100 \\, \\text{J}$", "D": "$L = 400 \\, \\text{J}$", "E": "$L = 500 \\, \\text{J}$", "F": "$L = 140 \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-036',
  10,
  'Un gaz ideal monoatomic se află inițial la presiunea $p_1 = 10^5 \, \text{Pa}$, volumul $V_1 = 6 \, \text{L}$ și temperatura $T_1 = 300 \, \text{K}$. Gazul suferă o expansiune adiabatică până când volumul devine $V_2 = 12 \, \text{L}$. Care este temperatura finală? Se dă $\gamma = 5/3$ și $2^{2/3} \approx 1.587$.',
  3,
  '{"A": "$T_2 \\approx 189 \\, \\text{K}$", "B": "$T_2 \\approx 150 \\, \\text{K}$", "C": "$T_2 = 600 \\, \\text{K}$", "D": "$T_2 \\approx 238 \\, \\text{K}$", "E": "$T_2 \\approx 300 \\, \\text{K}$", "F": "$T_2 \\approx 100 \\, \\text{K}$"}'::jsonb,
  'A'
),

-- ==========================================
-- CALORIMETRIE AVANSATĂ
-- ==========================================

(
  'FIZ-X-037',
  10,
  'Un bloc de gheață de masă $m_1 = 200 \, \text{g}$ la temperatura $t_1 = -20°\text{C}$ este introdus în $m_2 = 500 \, \text{g}$ de apă la $t_2 = 50°\text{C}$. Care este temperatura finală de echilibru? Se dă: $c_{gheata} = 2.1 \, \text{J/(g} \cdot \text{K)}$, $c_{apa} = 4.2 \, \text{J/(g} \cdot \text{K)}$, $L_{topire} = 334 \, \text{J/g}$.',
  3,
  '{"A": "$t_f \\approx 18°\\text{C}$", "B": "$t_f \\approx 25°\\text{C}$", "C": "$t_f = 0°\\text{C}$", "D": "$t_f \\approx 35°\\text{C}$", "E": "$t_f \\approx 10°\\text{C}$", "F": "$t_f \\approx 5°\\text{C}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-038',
  10,
  'În $m_1 = 400 \, \text{g}$ de apă la $t_1 = 20°\text{C}$ se introduce vapori de apă la $t_2 = 100°\text{C}$. Ce masă de vapori este necesară pentru ca temperatura finală să fie $t_f = 60°\text{C}$? Se dă: $c_{apa} = 4.2 \, \text{J/(g} \cdot \text{K)}$, $L_{vaporizare} = 2260 \, \text{J/g}$.',
  3,
  '{"A": "$m_2 \\approx 28 \\, \\text{g}$", "B": "$m_2 \\approx 50 \\, \\text{g}$", "C": "$m_2 \\approx 40 \\, \\text{g}$", "D": "$m_2 \\approx 20 \\, \\text{g}$", "E": "$m_2 \\approx 35 \\, \\text{g}$", "F": "$m_2 \\approx 60 \\, \\text{g}$"}'::jsonb,
  'A'
),

-- ==========================================
-- PROBLEME DE COMPETIȚIE
-- ==========================================

(
  'FIZ-X-039',
  10,
  'Un recipient rigid de volum $V$ conține $n$ moli de gaz ideal monoatomic. Recipientul primește căldura $Q$. Cu cât crește presiunea gazului?',
  3,
  '{"A": "$\\Delta p = \\frac{2Q}{3V}$", "B": "$\\Delta p = \\frac{Q}{V}$", "C": "$\\Delta p = \\frac{Q}{nRT}$", "D": "$\\Delta p = \\frac{3Q}{2V}$", "E": "$\\Delta p = \\frac{Q}{2V}$", "F": "$\\Delta p = \\frac{5Q}{3V}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-040',
  10,
  'Un gaz ideal monoatomic se destinde liber (în vid) dublându-și volumul, apoi este comprimat izoterm la volumul inițial. Care este raportul dintre căldura cedată mediului și energia internă inițială a gazului? Se dă $\ln 2 \approx 0.693$.',
  3,
  '{"A": "$Q/U \\approx 0.46$", "B": "$Q/U = 1$", "C": "$Q/U = 0$", "D": "$Q/U \\approx 0.69$", "E": "$Q/U = 2$", "F": "$Q/U \\approx 1.5$"}'::jsonb,
  'A'
),

(
  'FIZ-X-041',
  10,
  'Un cilindru orizontal cu piston conține $n = 1 \, \text{mol}$ de gaz ideal monoatomic la temperatura $T_0 = 300 \, \text{K}$. Gazul se încălzește astfel încât presiunea crește liniar cu volumul conform $p = p_0(1 + V/V_0)$. Când volumul se dublează, care este temperatura finală?',
  3,
  '{"A": "$T = 1800 \\, \\text{K}$", "B": "$T = 900 \\, \\text{K}$", "C": "$T = 600 \\, \\text{K}$", "D": "$T = 1200 \\, \\text{K}$", "E": "$T = 2400 \\, \\text{K}$", "F": "$T = 450 \\, \\text{K}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-042',
  10,
  'Un mol de gaz ideal monoatomic efectuează un ciclu 1-2-3-1 în care: 1-2 este izobară cu $V_2 = 2V_1$, 2-3 este izocoră cu $p_3 = p_1/2$, iar 3-1 revine la starea inițială. Care este randamentul ciclului?',
  3,
  '{"A": "$\\eta = 25\\%$", "B": "$\\eta \\approx 11\\%$", "C": "$\\eta = 50\\%$", "D": "$\\eta \\approx 33\\%$", "E": "$\\eta = 20\\%$", "F": "$\\eta \\approx 16.7\\%$"}'::jsonb,
  'B'
),

(
  'FIZ-X-043',
  10,
  'Două recipiente identice de volum $V$ sunt unite printr-un tub cu robinet închis. Primul recipient conține gaz ideal la presiunea $p_1 = 3 \times 10^5 \, \text{Pa}$ și temperatura $T_1 = 300 \, \text{K}$, iar al doilea conține același gaz la $p_2 = 10^5 \, \text{Pa}$ și $T_2 = 400 \, \text{K}$. După deschiderea robinetului și atingerea echilibrului termic la $T = 350 \, \text{K}$, care este presiunea finală?',
  3,
  '{"A": "$p_f \\approx 1.75 \\times 10^5 \\, \\text{Pa}$", "B": "$p_f = 2 \\times 10^5 \\, \\text{Pa}$", "C": "$p_f \\approx 1.5 \\times 10^5 \\, \\text{Pa}$", "D": "$p_f \\approx 2.25 \\times 10^5 \\, \\text{Pa}$", "E": "$p_f = 10^5 \\, \\text{Pa}$", "F": "$p_f \\approx 1.87 \\times 10^5 \\, \\text{Pa}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-044',
  10,
  'Un cilindru vertical cu piston de masă $m$ și secțiune $S$ conține $n$ moli de gaz ideal monoatomic. Presiunea atmosferică este $p_0$. Gazul este încălzit astfel încât pistonul urcă cu $h$. Care este căldura primită de gaz? Se dă $g$ = accelerația gravitațională.',
  3,
  '{"A": "$Q = \\frac{5}{2}\\left(p_0 + \\frac{mg}{S}\\right)Sh$", "B": "$Q = \\frac{3}{2}\\left(p_0 + \\frac{mg}{S}\\right)Sh$", "C": "$Q = \\left(p_0 + \\frac{mg}{S}\\right)Sh$", "D": "$Q = \\frac{7}{2}\\left(p_0 + \\frac{mg}{S}\\right)Sh$", "E": "$Q = 2\\left(p_0 + \\frac{mg}{S}\\right)Sh$", "F": "$Q = \\frac{5}{3}\\left(p_0 + \\frac{mg}{S}\\right)Sh$"}'::jsonb,
  'A'
);

-- ==========================================
-- VERIFICARE
-- ==========================================
-- Rulați această comandă pentru a verifica numărul de grile pentru clasa a X-a:
-- SELECT COUNT(*) as total_grile_clasa_10 FROM quiz_questions WHERE class = 10;
