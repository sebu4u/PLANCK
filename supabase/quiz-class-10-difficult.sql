-- ==========================================
-- GRILE DIFICILE - CLASA A X-A
-- Fizică pentru admitere și antrenament
-- 20 întrebări (FIZ-X-005 până la FIZ-X-024)
-- ==========================================

-- Teme acoperite:
-- - Termodinamică (transformări, gaze ideale, lucru mecanic)
-- - Teoria cinetică a gazelor
-- - Principiile termodinamicii
-- - Calorimetrie și schimburi de căldură
-- - Motoare termice și randament

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES

-- ==========================================
-- TRANSFORMĂRI TERMODINAMICE
-- ==========================================

(
  'FIZ-X-005',
  10,
  'Un gaz ideal trece printr-o transformare izocoră de la starea $(p_1, V, T_1)$ la starea $(p_2, V, T_2)$. Dacă $T_2 = 3T_1$, care este raportul $p_2/p_1$?',
  3,
  '{"A": "$p_2/p_1 = 1$", "B": "$p_2/p_1 = 3$", "C": "$p_2/p_1 = 1/3$", "D": "$p_2/p_1 = 9$", "E": "$p_2/p_1 = \\sqrt{3}$", "F": "$p_2/p_1 = 6$"}'::jsonb,
  'B'
),

(
  'FIZ-X-006',
  10,
  'Un mol de gaz ideal monoatomic se află la temperatura $T = 300 \, \text{K}$. Care este energia cinetică medie a unei molecule? Se dă $k_B = 1.38 \times 10^{-23} \, \text{J/K}$.',
  3,
  '{"A": "$E_c = 6.21 \\times 10^{-21} \\, \\text{J}$", "B": "$E_c = 2.07 \\times 10^{-21} \\, \\text{J}$", "C": "$E_c = 4.14 \\times 10^{-21} \\, \\text{J}$", "D": "$E_c = 1.24 \\times 10^{-20} \\, \\text{J}$", "E": "$E_c = 3.73 \\times 10^{-21} \\, \\text{J}$", "F": "$E_c = 8.28 \\times 10^{-21} \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-007',
  10,
  'Un gaz ideal efectuează o transformare izotermă la temperatura $T = 400 \, \text{K}$, volumul crescând de la $V_1 = 2 \, \text{L}$ la $V_2 = 8 \, \text{L}$. Câți moli de gaz sunt dacă lucrul mecanic efectuat este $L = 4608 \, \text{J}$? Se dă $R = 8.31 \, \text{J/(mol} \cdot \text{K)}$ și $\ln 4 \approx 1.39$.',
  3,
  '{"A": "$\\nu = 1 \\, \\text{mol}$", "B": "$\\nu = 2 \\, \\text{mol}$", "C": "$\\nu = 4 \\, \\text{mol}$", "D": "$\\nu = 0.5 \\, \\text{mol}$", "E": "$\\nu = 3 \\, \\text{mol}$", "F": "$\\nu = 1.5 \\, \\text{mol}$"}'::jsonb,
  'C'
),

(
  'FIZ-X-008',
  10,
  'Într-o transformare adiabatică a unui gaz ideal monoatomic ($\gamma = 5/3$), volumul crește de 8 ori. Cu ce factor se modifică temperatura?',
  3,
  '{"A": "$T_2/T_1 = 1/8$", "B": "$T_2/T_1 = 1/4$", "C": "$T_2/T_1 = 1/2$", "D": "$T_2/T_1 = 4$", "E": "$T_2/T_1 = 8$", "F": "$T_2/T_1 = 2$"}'::jsonb,
  'B'
),

(
  'FIZ-X-009',
  10,
  'Un cilindru cu piston conține $n = 2 \, \text{mol}$ de gaz ideal la presiunea $p = 10^5 \, \text{Pa}$ și temperatura $T_1 = 300 \, \text{K}$. Gazul se încălzește izobar până la $T_2 = 600 \, \text{K}$. Care este lucrul mecanic efectuat? Se dă $R = 8.31 \, \text{J/(mol} \cdot \text{K)}$.',
  3,
  '{"A": "$L = 2493 \\, \\text{J}$", "B": "$L = 4986 \\, \\text{J}$", "C": "$L = 9972 \\, \\text{J}$", "D": "$L = 1662 \\, \\text{J}$", "E": "$L = 8310 \\, \\text{J}$", "F": "$L = 4155 \\, \\text{J}$"}'::jsonb,
  'B'
),

-- ==========================================
-- GAZELE IDEALE ȘI ECUAȚIA DE STARE
-- ==========================================

(
  'FIZ-X-010',
  10,
  'Un recipient de volum $V = 10 \, \text{L}$ conține oxigen ($M = 32 \, \text{g/mol}$) la presiunea $p = 2 \times 10^5 \, \text{Pa}$ și temperatura $T = 400 \, \text{K}$. Care este masa gazului? Se dă $R = 8.31 \, \text{J/(mol} \cdot \text{K)}$.',
  3,
  '{"A": "$m = 19.2 \\, \\text{g}$", "B": "$m = 9.6 \\, \\text{g}$", "C": "$m = 38.4 \\, \\text{g}$", "D": "$m = 48 \\, \\text{g}$", "E": "$m = 6.4 \\, \\text{g}$", "F": "$m = 12.8 \\, \\text{g}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-011',
  10,
  'Două gaze ideale cu masele $m_1$ și $m_2$ și masele molare $M_1$ și $M_2$ sunt amestecate într-un recipient la temperatura $T$. Care este expresia corectă pentru presiunea totală conform legii lui Dalton?',
  3,
  '{"A": "$p = \\frac{(m_1 + m_2)RT}{M_1 M_2 V}$", "B": "$p = \\frac{RT}{V}\\left(\\frac{m_1}{M_1} + \\frac{m_2}{M_2}\\right)$", "C": "$p = \\frac{(m_1 M_1 + m_2 M_2)RT}{V}$", "D": "$p = \\frac{m_1 + m_2}{M_1 + M_2} \\cdot \\frac{RT}{V}$", "E": "$p = \\frac{m_1 m_2 RT}{(M_1 + M_2)V}$", "F": "$p = \\frac{\\sqrt{m_1 m_2}RT}{\\sqrt{M_1 M_2}V}$"}'::jsonb,
  'B'
),

(
  'FIZ-X-012',
  10,
  'Viteza medie pătratică a moleculelor unui gaz ideal la temperatura $T_1$ este $v_1 = 500 \, \text{m/s}$. La ce temperatură $T_2$ viteza medie pătratică devine $v_2 = 1000 \, \text{m/s}$, dacă $T_1 = 300 \, \text{K}$?',
  3,
  '{"A": "$T_2 = 600 \\, \\text{K}$", "B": "$T_2 = 1200 \\, \\text{K}$", "C": "$T_2 = 900 \\, \\text{K}$", "D": "$T_2 = 1500 \\, \\text{K}$", "E": "$T_2 = 2400 \\, \\text{K}$", "F": "$T_2 = 150 \\, \\text{K}$"}'::jsonb,
  'B'
),

-- ==========================================
-- PRINCIPIUL I AL TERMODINAMICII
-- ==========================================

(
  'FIZ-X-013',
  10,
  'Un gaz ideal monoatomic primește căldura $Q = 500 \, \text{J}$ într-o transformare izocoră. Care este variația energiei interne?',
  2,
  '{"A": "$\\Delta U = 0$", "B": "$\\Delta U = 250 \\, \\text{J}$", "C": "$\\Delta U = 500 \\, \\text{J}$", "D": "$\\Delta U = 300 \\, \\text{J}$", "E": "$\\Delta U = 750 \\, \\text{J}$", "F": "$\\Delta U = -500 \\, \\text{J}$"}'::jsonb,
  'C'
),

(
  'FIZ-X-014',
  10,
  'Un gaz ideal diatomic ($C_V = 5R/2$, $C_p = 7R/2$) efectuează o expansiune izobară. Dacă lucrul mecanic efectuat este $L = 200 \, \text{J}$, care este căldura primită de gaz?',
  3,
  '{"A": "$Q = 200 \\, \\text{J}$", "B": "$Q = 500 \\, \\text{J}$", "C": "$Q = 700 \\, \\text{J}$", "D": "$Q = 400 \\, \\text{J}$", "E": "$Q = 350 \\, \\text{J}$", "F": "$Q = 1000 \\, \\text{J}$"}'::jsonb,
  'C'
),

(
  'FIZ-X-015',
  10,
  'Un gaz ideal suferă un ciclu termodinamic în care primește $Q_1 = 800 \, \text{J}$ de la sursa caldă și cedează $Q_2 = 500 \, \text{J}$ sursei reci. Care este randamentul ciclului?',
  3,
  '{"A": "$\\eta = 37.5\\%$", "B": "$\\eta = 62.5\\%$", "C": "$\\eta = 40\\%$", "D": "$\\eta = 60\\%$", "E": "$\\eta = 25\\%$", "F": "$\\eta = 50\\%$"}'::jsonb,
  'A'
),

(
  'FIZ-X-016',
  10,
  'Un motor Carnot funcționează între temperaturile $T_1 = 500 \, \text{K}$ (sursa caldă) și $T_2 = 300 \, \text{K}$ (sursa rece). Care este randamentul maxim al acestui motor?',
  3,
  '{"A": "$\\eta = 20\\%$", "B": "$\\eta = 40\\%$", "C": "$\\eta = 60\\%$", "D": "$\\eta = 80\\%$", "E": "$\\eta = 50\\%$", "F": "$\\eta = 30\\%$"}'::jsonb,
  'B'
),

-- ==========================================
-- CALORIMETRIE ȘI SCHIMBURI DE CĂLDURĂ
-- ==========================================

(
  'FIZ-X-017',
  10,
  'Un bloc de cupru de masă $m = 500 \, \text{g}$ la temperatura $t_1 = 100°\text{C}$ este introdus într-un calorimetru cu $M = 200 \, \text{g}$ apă la $t_2 = 20°\text{C}$. Care este temperatura de echilibru? Se dă $c_{Cu} = 0.39 \, \text{J/(g} \cdot °\text{C)}$, $c_{apa} = 4.18 \, \text{J/(g} \cdot °\text{C)}$.',
  3,
  '{"A": "$t_f \\approx 35°\\text{C}$", "B": "$t_f \\approx 42°\\text{C}$", "C": "$t_f \\approx 50°\\text{C}$", "D": "$t_f \\approx 28°\\text{C}$", "E": "$t_f \\approx 60°\\text{C}$", "F": "$t_f \\approx 55°\\text{C}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-018',
  10,
  'Câtă căldură este necesară pentru a transforma $m = 100 \, \text{g}$ de gheață de la $-10°\text{C}$ în vapori de apă la $100°\text{C}$? Se dă: $c_{gheata} = 2.09 \, \text{J/(g} \cdot \text{K)}$, $c_{apa} = 4.18 \, \text{J/(g} \cdot \text{K)}$, $L_{topire} = 334 \, \text{J/g}$, $L_{vaporizare} = 2260 \, \text{J/g}$.',
  3,
  '{"A": "$Q \\approx 260 \\, \\text{kJ}$", "B": "$Q \\approx 301 \\, \\text{kJ}$", "C": "$Q \\approx 340 \\, \\text{kJ}$", "D": "$Q \\approx 226 \\, \\text{kJ}$", "E": "$Q \\approx 180 \\, \\text{kJ}$", "F": "$Q \\approx 420 \\, \\text{kJ}$"}'::jsonb,
  'B'
),

-- ==========================================
-- PROBLEME COMPLEXE CU CICLURI
-- ==========================================

(
  'FIZ-X-019',
  10,
  'Un gaz ideal parcurge un ciclu format din două izocore și două izobare. Cunoscând $p_1 = 10^5 \, \text{Pa}$, $p_2 = 3 \times 10^5 \, \text{Pa}$, $V_1 = 2 \, \text{L}$ și $V_2 = 6 \, \text{L}$, care este lucrul mecanic efectuat într-un ciclu complet?',
  3,
  '{"A": "$L = 800 \\, \\text{J}$", "B": "$L = 400 \\, \\text{J}$", "C": "$L = 1200 \\, \\text{J}$", "D": "$L = 600 \\, \\text{J}$", "E": "$L = 1600 \\, \\text{J}$", "F": "$L = 200 \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-020',
  10,
  'Un gaz ideal monoatomic efectuează o expansiune liberă (în vid) de la volumul $V_1$ la volumul $V_2 = 2V_1$. Care este variația temperaturii în acest proces?',
  3,
  '{"A": "$\\Delta T = T_1$", "B": "$\\Delta T = -T_1/2$", "C": "$\\Delta T = 0$", "D": "$\\Delta T = T_1/2$", "E": "$\\Delta T = -T_1$", "F": "$\\Delta T = 2T_1$"}'::jsonb,
  'C'
),

-- ==========================================
-- APLICAȚII PRACTICE ȘI PROBLEME CONCEPTUALE
-- ==========================================

(
  'FIZ-X-021',
  10,
  'Un frigider are coeficientul de performanță $\varepsilon = 4$. Dacă cedează sursei calde (camera) căldura $Q_1 = 500 \, \text{J}$, care este lucrul mecanic consumat?',
  3,
  '{"A": "$L = 100 \\, \\text{J}$", "B": "$L = 125 \\, \\text{J}$", "C": "$L = 200 \\, \\text{J}$", "D": "$L = 80 \\, \\text{J}$", "E": "$L = 400 \\, \\text{J}$", "F": "$L = 250 \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-X-022',
  10,
  'Pentru un gaz ideal, raportul $\gamma = C_p/C_V = 1.4$. Despre ce tip de gaz este vorba?',
  2,
  '{"A": "Gaz monoatomic", "B": "Gaz diatomic", "C": "Gaz triatomic liniar", "D": "Gaz triatomic neliniar", "E": "Gaz poliatomic (mai mult de 4 atomi)", "F": "Nu se poate determina"}'::jsonb,
  'B'
),

(
  'FIZ-X-023',
  10,
  'Într-un proces politropic, un gaz ideal trece de la starea $(p_1, V_1)$ la starea $(p_2, V_2)$ astfel încât $p_1 V_1^n = p_2 V_2^n$ cu $n = 2$. Dacă $V_2 = 2V_1$, care este raportul $p_1/p_2$?',
  3,
  '{"A": "$p_1/p_2 = 2$", "B": "$p_1/p_2 = 4$", "C": "$p_1/p_2 = 1/2$", "D": "$p_1/p_2 = 1/4$", "E": "$p_1/p_2 = 8$", "F": "$p_1/p_2 = 1$"}'::jsonb,
  'D'
),

(
  'FIZ-X-024',
  10,
  'Un gaz ideal monoatomic suferă o transformare în care $pV^2 = \text{const}$. În acest proces, căldura molară $C$ este egală cu: (Se dă $C_V = 3R/2$ pentru gaz monoatomic)',
  3,
  '{"A": "$C = R/2$", "B": "$C = -R/2$", "C": "$C = 0$", "D": "$C = R$", "E": "$C = 3R/2$", "F": "$C = 2R$"}'::jsonb,
  'B'
);

-- ==========================================
-- VERIFICARE
-- ==========================================
-- Rulați această comandă pentru a verifica numărul de grile pentru clasa a X-a:
-- SELECT COUNT(*) as total_grile_clasa_10 FROM quiz_questions WHERE class = 10;
