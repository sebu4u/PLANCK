-- ==========================================
-- GRILE ADIȚIONALE - CLASA A IX-A (BATCH 2)
-- Probleme de nivel mediu și avansat pentru admitere
-- 20 întrebări noi (FIZ-IX-026 până la FIZ-IX-045)
-- ==========================================

-- Teme acoperite:
-- - Vectori și compunerea forțelor
-- - Mișcare circulară uniformă
-- - Impuls și cantitate de mișcare
-- - Ciocniri elastice și inelastice
-- - Echilibrul corpurilor
-- - Pârghii și momente de forță
-- - Termodinamică de bază

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES

-- ==========================================
-- VECTORI ȘI COMPUNEREA FORȚELOR
-- ==========================================

(
  'FIZ-IX-026',
  9,
  'Două forțe cu modulele $F_1 = 3 \, \text{N}$ și $F_2 = 4 \, \text{N}$ acționează asupra unui corp. Care este modulul rezultantei dacă forțele sunt perpendiculare?',
  2,
  '{"A": "$R = 5 \\, \\text{N}$", "B": "$R = 7 \\, \\text{N}$", "C": "$R = 1 \\, \\text{N}$", "D": "$R = 12 \\, \\text{N}$", "E": "$R = 6 \\, \\text{N}$", "F": "$R = 3.5 \\, \\text{N}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-027',
  9,
  'Trei forțe coplanare și concurente au modulele $F_1 = 10 \, \text{N}$, $F_2 = 10 \, \text{N}$ și $F_3 = 10 \, \text{N}$, unghiurile dintre ele fiind de $120°$. Care este rezultanta?',
  3,
  '{"A": "$R = 0 \\, \\text{N}$", "B": "$R = 30 \\, \\text{N}$", "C": "$R = 10 \\, \\text{N}$", "D": "$R = 20 \\, \\text{N}$", "E": "$R = 15 \\, \\text{N}$", "F": "$R = 5 \\, \\text{N}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-028',
  9,
  'Două forțe cu modulele egale $F_1 = F_2 = 10 \, \text{N}$ formează un unghi de $60°$. Care este modulul rezultantei?',
  2,
  '{"A": "$R \\approx 17.3 \\, \\text{N}$", "B": "$R = 20 \\, \\text{N}$", "C": "$R = 10 \\, \\text{N}$", "D": "$R \\approx 14.1 \\, \\text{N}$", "E": "$R = 5 \\, \\text{N}$", "F": "$R \\approx 8.7 \\, \\text{N}$"}'::jsonb,
  'A'
),

-- ==========================================
-- MIȘCARE CIRCULARĂ UNIFORMĂ
-- ==========================================

(
  'FIZ-IX-029',
  9,
  'Un corp se rotește uniform pe un cerc cu raza $r = 2 \, \text{m}$, efectuând $10$ rotații complete în $20 \, \text{s}$. Care este viteza liniară?',
  2,
  '{"A": "$v \\approx 6.28 \\, \\text{m/s}$", "B": "$v = 1 \\, \\text{m/s}$", "C": "$v \\approx 3.14 \\, \\text{m/s}$", "D": "$v = 10 \\, \\text{m/s}$", "E": "$v \\approx 12.56 \\, \\text{m/s}$", "F": "$v = 2 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-030',
  9,
  'Un corp cu masa $m = 0.5 \, \text{kg}$ se rotește pe un cerc orizontal cu raza $r = 1 \, \text{m}$ și viteza $v = 4 \, \text{m/s}$. Care este forța centripetă?',
  2,
  '{"A": "$F_c = 8 \\, \\text{N}$", "B": "$F_c = 2 \\, \\text{N}$", "C": "$F_c = 4 \\, \\text{N}$", "D": "$F_c = 16 \\, \\text{N}$", "E": "$F_c = 1 \\, \\text{N}$", "F": "$F_c = 32 \\, \\text{N}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-031',
  9,
  'Care este accelerația centripetă a unui punct de pe ecuatorul Pământului? Se dă raza Pământului $R = 6400 \, \text{km}$ și perioada de rotație $T = 24 \, \text{h}$.',
  3,
  '{"A": "$a_c \\approx 0.034 \\, \\text{m/s}^2$", "B": "$a_c \\approx 0.34 \\, \\text{m/s}^2$", "C": "$a_c \\approx 3.4 \\, \\text{m/s}^2$", "D": "$a_c \\approx 0.0034 \\, \\text{m/s}^2$", "E": "$a_c \\approx 9.8 \\, \\text{m/s}^2$", "F": "$a_c \\approx 1 \\, \\text{m/s}^2$"}'::jsonb,
  'A'
),

-- ==========================================
-- IMPULS ȘI CANTITATE DE MIȘCARE
-- ==========================================

(
  'FIZ-IX-032',
  9,
  'Un corp cu masa $m = 2 \, \text{kg}$ își mărește viteza de la $v_1 = 3 \, \text{m/s}$ la $v_2 = 8 \, \text{m/s}$. Care este variația cantității de mișcare?',
  2,
  '{"A": "$\\Delta p = 10 \\, \\text{kg} \\cdot \\text{m/s}$", "B": "$\\Delta p = 5 \\, \\text{kg} \\cdot \\text{m/s}$", "C": "$\\Delta p = 22 \\, \\text{kg} \\cdot \\text{m/s}$", "D": "$\\Delta p = 16 \\, \\text{kg} \\cdot \\text{m/s}$", "E": "$\\Delta p = 6 \\, \\text{kg} \\cdot \\text{m/s}$", "F": "$\\Delta p = 11 \\, \\text{kg} \\cdot \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-033',
  9,
  'O bilă cu masa $m = 0.1 \, \text{kg}$ lovește un perete cu viteza $v = 10 \, \text{m/s}$ și ricoșează cu aceeași viteză în direcție opusă. Care este impulsul forței exercitate de perete asupra bilei?',
  3,
  '{"A": "$J = 2 \\, \\text{kg} \\cdot \\text{m/s}$", "B": "$J = 1 \\, \\text{kg} \\cdot \\text{m/s}$", "C": "$J = 0 \\, \\text{kg} \\cdot \\text{m/s}$", "D": "$J = 0.5 \\, \\text{kg} \\cdot \\text{m/s}$", "E": "$J = 10 \\, \\text{kg} \\cdot \\text{m/s}$", "F": "$J = 20 \\, \\text{kg} \\cdot \\text{m/s}$"}'::jsonb,
  'A'
),

-- ==========================================
-- CIOCNIRI
-- ==========================================

(
  'FIZ-IX-034',
  9,
  'Două corpuri cu mase egale $m_1 = m_2 = 2 \, \text{kg}$ se ciocnesc frontal și perfect inelastic. Vitezele inițiale sunt $v_1 = 6 \, \text{m/s}$ și $v_2 = 2 \, \text{m/s}$ (în sens opus). Care este viteza după ciocnire?',
  3,
  '{"A": "$v = 2 \\, \\text{m/s}$", "B": "$v = 4 \\, \\text{m/s}$", "C": "$v = 0 \\, \\text{m/s}$", "D": "$v = 8 \\, \\text{m/s}$", "E": "$v = 1 \\, \\text{m/s}$", "F": "$v = 3 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-035',
  9,
  'Un corp cu masa $m_1 = 3 \, \text{kg}$ și viteza $v_1 = 4 \, \text{m/s}$ ciocnește perfect inelastic un corp în repaus cu masa $m_2 = 1 \, \text{kg}$. Care este viteza comună după ciocnire?',
  2,
  '{"A": "$v = 3 \\, \\text{m/s}$", "B": "$v = 4 \\, \\text{m/s}$", "C": "$v = 2 \\, \\text{m/s}$", "D": "$v = 1 \\, \\text{m/s}$", "E": "$v = 12 \\, \\text{m/s}$", "F": "$v = 6 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-036',
  9,
  'Care este energia cinetică pierdută în ciocnirea de la problema anterioară?',
  3,
  '{"A": "$\\Delta E_c = 6 \\, \\text{J}$", "B": "$\\Delta E_c = 12 \\, \\text{J}$", "C": "$\\Delta E_c = 0 \\, \\text{J}$", "D": "$\\Delta E_c = 24 \\, \\text{J}$", "E": "$\\Delta E_c = 3 \\, \\text{J}$", "F": "$\\Delta E_c = 18 \\, \\text{J}$"}'::jsonb,
  'A'
),

-- ==========================================
-- ECHILIBRU ȘI PÂRGHII
-- ==========================================

(
  'FIZ-IX-037',
  9,
  'O bară omogenă cu masa $m = 10 \, \text{kg}$ și lungimea $L = 2 \, \text{m}$ este sprijinită la un capăt. Care este momentul greutății barei față de punctul de sprijin? Se dă $g = 10 \, \text{m/s}^2$.',
  2,
  '{"A": "$M = 100 \\, \\text{N} \\cdot \\text{m}$", "B": "$M = 200 \\, \\text{N} \\cdot \\text{m}$", "C": "$M = 50 \\, \\text{N} \\cdot \\text{m}$", "D": "$M = 20 \\, \\text{N} \\cdot \\text{m}$", "E": "$M = 10 \\, \\text{N} \\cdot \\text{m}$", "F": "$M = 1000 \\, \\text{N} \\cdot \\text{m}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-038',
  9,
  'O pârghie de gradul I are brațele $b_1 = 0.4 \, \text{m}$ și $b_2 = 1.2 \, \text{m}$. Ce forță trebuie aplicată la capătul brațului lung pentru a echilibra o greutate de $60 \, \text{N}$ la capătul brațului scurt?',
  2,
  '{"A": "$F = 20 \\, \\text{N}$", "B": "$F = 180 \\, \\text{N}$", "C": "$F = 30 \\, \\text{N}$", "D": "$F = 15 \\, \\text{N}$", "E": "$F = 40 \\, \\text{N}$", "F": "$F = 72 \\, \\text{N}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-039',
  9,
  'Un scripete mobil este folosit pentru a ridica o greutate $G = 200 \, \text{N}$. Neglijând frecarea și masa scripetului, care este forța necesară pentru a ridica greutatea cu viteză constantă?',
  2,
  '{"A": "$F = 100 \\, \\text{N}$", "B": "$F = 200 \\, \\text{N}$", "C": "$F = 400 \\, \\text{N}$", "D": "$F = 50 \\, \\text{N}$", "E": "$F = 150 \\, \\text{N}$", "F": "$F = 300 \\, \\text{N}$"}'::jsonb,
  'A'
),

-- ==========================================
-- TERMODINAMICĂ DE BAZĂ
-- ==========================================

(
  'FIZ-IX-040',
  9,
  'O cantitate de gaz ideal ocupă volumul $V_1 = 2 \, \text{L}$ la presiunea $p_1 = 3 \, \text{atm}$. Care este volumul gazului la presiunea $p_2 = 1 \, \text{atm}$, temperatura fiind constantă?',
  2,
  '{"A": "$V_2 = 6 \\, \\text{L}$", "B": "$V_2 = 2 \\, \\text{L}$", "C": "$V_2 = 0.67 \\, \\text{L}$", "D": "$V_2 = 3 \\, \\text{L}$", "E": "$V_2 = 1 \\, \\text{L}$", "F": "$V_2 = 5 \\, \\text{L}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-041',
  9,
  'Care este căldura necesară pentru a încălzi $2 \, \text{kg}$ de apă de la $20°\text{C}$ la $80°\text{C}$? Se dă căldura specifică a apei $c = 4200 \, \text{J/(kg} \cdot \text{°C)}$.',
  2,
  '{"A": "$Q = 504000 \\, \\text{J}$", "B": "$Q = 50400 \\, \\text{J}$", "C": "$Q = 5040 \\, \\text{J}$", "D": "$Q = 168000 \\, \\text{J}$", "E": "$Q = 336000 \\, \\text{J}$", "F": "$Q = 84000 \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-042',
  9,
  'Se amestecă $1 \, \text{kg}$ de apă la $80°\text{C}$ cu $2 \, \text{kg}$ de apă la $20°\text{C}$. Care este temperatura de echilibru? (Se neglijează pierderile de căldură)',
  3,
  '{"A": "$T = 40°\\text{C}$", "B": "$T = 50°\\text{C}$", "C": "$T = 60°\\text{C}$", "D": "$T = 30°\\text{C}$", "E": "$T = 45°\\text{C}$", "F": "$T = 35°\\text{C}$"}'::jsonb,
  'A'
),

-- ==========================================
-- PROBLEME COMPLEXE DE SINTEZĂ
-- ==========================================

(
  'FIZ-IX-043',
  9,
  'Un pendul simplu oscilează cu amplitudinea $A$. La ce înălțime (față de punctul cel mai jos) viteza pendulului este jumătate din viteza maximă?',
  3,
  '{"A": "$h = 0.75 \\cdot h_{max}$", "B": "$h = 0.5 \\cdot h_{max}$", "C": "$h = 0.25 \\cdot h_{max}$", "D": "$h = 0.67 \\cdot h_{max}$", "E": "$h = 0.33 \\cdot h_{max}$", "F": "$h = 0.1 \\cdot h_{max}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-044',
  9,
  'Un corp cu masa $m = 5 \, \text{kg}$ este urcat pe un plan înclinat lung de $10 \, \text{m}$ și înalt de $6 \, \text{m}$. Coeficientul de frecare este $\mu = 0.2$. Care este lucrul mecanic total efectuat? Se dă $g = 10 \, \text{m/s}^2$.',
  3,
  '{"A": "$L = 380 \\, \\text{J}$", "B": "$L = 300 \\, \\text{J}$", "C": "$L = 500 \\, \\text{J}$", "D": "$L = 220 \\, \\text{J}$", "E": "$L = 600 \\, \\text{J}$", "F": "$L = 180 \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-045',
  9,
  'O mașină cu masa $m = 1000 \, \text{kg}$ accelerează de la $0$ la $v = 20 \, \text{m/s}$ pe o distanță $d = 100 \, \text{m}$. Care este puterea medie dezvoltată de motor, neglijând frecarea?',
  3,
  '{"A": "$P = 2000 \\, \\text{W}$", "B": "$P = 4000 \\, \\text{W}$", "C": "$P = 20000 \\, \\text{W}$", "D": "$P = 1000 \\, \\text{W}$", "E": "$P = 10000 \\, \\text{W}$", "F": "$P = 40000 \\, \\text{W}$"}'::jsonb,
  'A'
);

-- Verificare: Această comandă va afișa numărul total de grile pentru clasa a IX-a
-- SELECT COUNT(*) as total_grile_clasa_9 FROM quiz_questions WHERE class = 9;
