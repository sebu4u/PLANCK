-- ==========================================
-- GRILE ADIȚIONALE - CLASA A IX-A
-- Probleme de nivel mediu și avansat pentru admitere
-- 20 întrebări noi (FIZ-IX-006 până la FIZ-IX-025)
-- ==========================================

-- Teme acoperite:
-- - Cinematică (mișcare rectilinie uniformă și uniform variată)
-- - Dinamica punctului material (legi Newton, frecare, planuri înclinate)
-- - Lucrul mecanic și energia (teoreme de variație, conservare)
-- - Gravitație și sateliți
-- - Hidrostatică și presiune

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES

-- ==========================================
-- CINEMATICĂ AVANSATĂ
-- ==========================================

(
  'FIZ-IX-006',
  9,
  'Un mobil pornește din repaus și accelerează uniform cu $a = 2 \, \text{m/s}^2$ timp de $t_1 = 5 \, \text{s}$, apoi continuă cu viteză constantă încă $t_2 = 10 \, \text{s}$. Care este distanța totală parcursă?',
  3,
  '{"A": "$d = 125 \\, \\text{m}$", "B": "$d = 100 \\, \\text{m}$", "C": "$d = 150 \\, \\text{m}$", "D": "$d = 75 \\, \\text{m}$", "E": "$d = 175 \\, \\text{m}$", "F": "$d = 200 \\, \\text{m}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-007',
  9,
  'O minge este aruncată vertical în sus cu viteza inițială $v_0 = 20 \, \text{m/s}$. Care este înălțimea maximă atinsă? Se neglijează frecarea cu aerul și se consideră $g = 10 \, \text{m/s}^2$.',
  2,
  '{"A": "$h = 10 \\, \\text{m}$", "B": "$h = 20 \\, \\text{m}$", "C": "$h = 40 \\, \\text{m}$", "D": "$h = 15 \\, \\text{m}$", "E": "$h = 25 \\, \\text{m}$", "F": "$h = 30 \\, \\text{m}$"}'::jsonb,
  'B'
),

(
  'FIZ-IX-008',
  9,
  'Un corp cade liber de la înălțimea $h$. În ultimele $2 \, \text{s}$ ale căderii parcurge $60 \, \text{m}$. Care este înălțimea totală $h$? Se dă $g = 10 \, \text{m/s}^2$.',
  3,
  '{"A": "$h = 80 \\, \\text{m}$", "B": "$h = 60 \\, \\text{m}$", "C": "$h = 100 \\, \\text{m}$", "D": "$h = 125 \\, \\text{m}$", "E": "$h = 45 \\, \\text{m}$", "F": "$h = 90 \\, \\text{m}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-009',
  9,
  'Două mobile pornesc simultan din același punct în direcții perpendiculare cu vitezele $v_1 = 3 \, \text{m/s}$ și $v_2 = 4 \, \text{m/s}$. După câte secunde distanța dintre ele este $25 \, \text{m}$?',
  3,
  '{"A": "$t = 4 \\, \\text{s}$", "B": "$t = 5 \\, \\text{s}$", "C": "$t = 7 \\, \\text{s}$", "D": "$t = 3 \\, \\text{s}$", "E": "$t = 6 \\, \\text{s}$", "F": "$t = 10 \\, \\text{s}$"}'::jsonb,
  'B'
),

-- ==========================================
-- DINAMICĂ - LEGI NEWTON ȘI FORȚE
-- ==========================================

(
  'FIZ-IX-010',
  9,
  'Un corp cu masa $m = 10 \, \text{kg}$ se află pe un plan orizontal. Coeficientul de frecare statică este $\mu_s = 0.4$. Care este forța minimă orizontală necesară pentru a pune corpul în mișcare? Se dă $g = 10 \, \text{m/s}^2$.',
  2,
  '{"A": "$F = 40 \\, \\text{N}$", "B": "$F = 100 \\, \\text{N}$", "C": "$F = 25 \\, \\text{N}$", "D": "$F = 4 \\, \\text{N}$", "E": "$F = 50 \\, \\text{N}$", "F": "$F = 60 \\, \\text{N}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-011',
  9,
  'Un corp cu masa $m = 5 \, \text{kg}$ este tras pe un plan orizontal cu o forță $F = 30 \, \text{N}$ înclinată la $60°$ față de orizontală. Neglijând frecarea, care este accelerația corpului?',
  3,
  '{"A": "$a = 3 \\, \\text{m/s}^2$", "B": "$a = 6 \\, \\text{m/s}^2$", "C": "$a = 5.2 \\, \\text{m/s}^2$", "D": "$a = 2 \\, \\text{m/s}^2$", "E": "$a = 4 \\, \\text{m/s}^2$", "F": "$a = 1.5 \\, \\text{m/s}^2$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-012',
  9,
  'Două corpuri cu masele $m_1 = 2 \, \text{kg}$ și $m_2 = 3 \, \text{kg}$ sunt legate printr-un fir inextensibil și sunt trase cu forța $F = 25 \, \text{N}$. Care este tensiunea în fir? Se neglijează frecarea.',
  3,
  '{"A": "$T = 10 \\, \\text{N}$", "B": "$T = 15 \\, \\text{N}$", "C": "$T = 20 \\, \\text{N}$", "D": "$T = 12 \\, \\text{N}$", "E": "$T = 8 \\, \\text{N}$", "F": "$T = 5 \\, \\text{N}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-013',
  9,
  'Un corp cu masa $m = 4 \, \text{kg}$ alunecă pe un plan înclinat cu unghiul $\alpha = 30°$. Coeficientul de frecare cinetică este $\mu = 0.2$. Care este accelerația corpului? Se dă $g = 10 \, \text{m/s}^2$ și $\cos 30° \approx 0.87$.',
  3,
  '{"A": "$a \\approx 3.3 \\, \\text{m/s}^2$", "B": "$a \\approx 5 \\, \\text{m/s}^2$", "C": "$a \\approx 2 \\, \\text{m/s}^2$", "D": "$a \\approx 4.1 \\, \\text{m/s}^2$", "E": "$a \\approx 1.5 \\, \\text{m/s}^2$", "F": "$a \\approx 6 \\, \\text{m/s}^2$"}'::jsonb,
  'A'
),

-- ==========================================
-- LUCRU MECANIC ȘI ENERGIE
-- ==========================================

(
  'FIZ-IX-014',
  9,
  'Un corp cu masa $m = 2 \, \text{kg}$ cade liber de la înălțimea $h = 45 \, \text{m}$. Care este viteza corpului când energia cinetică este egală cu energia potențială? Se dă $g = 10 \, \text{m/s}^2$.',
  3,
  '{"A": "$v \\approx 21.2 \\, \\text{m/s}$", "B": "$v = 30 \\, \\text{m/s}$", "C": "$v = 15 \\, \\text{m/s}$", "D": "$v = 20 \\, \\text{m/s}$", "E": "$v \\approx 25 \\, \\text{m/s}$", "F": "$v = 10 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-015',
  9,
  'O forță constantă $F = 100 \, \text{N}$ acționează asupra unui corp pe o distanță $d = 5 \, \text{m}$, unghiul dintre forță și deplasare fiind $60°$. Care este lucrul mecanic efectuat?',
  2,
  '{"A": "$L = 500 \\, \\text{J}$", "B": "$L = 250 \\, \\text{J}$", "C": "$L = 433 \\, \\text{J}$", "D": "$L = 0 \\, \\text{J}$", "E": "$L = 100 \\, \\text{J}$", "F": "$L = 866 \\, \\text{J}$"}'::jsonb,
  'B'
),

(
  'FIZ-IX-016',
  9,
  'Un corp cu masa $m = 3 \, \text{kg}$ se deplasează cu viteza $v_1 = 4 \, \text{m/s}$. O forță efectuează lucrul mecanic $L = 21 \, \text{J}$ asupra corpului. Care este viteza finală?',
  3,
  '{"A": "$v_2 = 5 \\, \\text{m/s}$", "B": "$v_2 = 6 \\, \\text{m/s}$", "C": "$v_2 = 7 \\, \\text{m/s}$", "D": "$v_2 = 8 \\, \\text{m/s}$", "E": "$v_2 = 4.5 \\, \\text{m/s}$", "F": "$v_2 = 10 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-017',
  9,
  'Un corp este aruncat vertical în sus. În ce punct al traiectoriei energia cinetică reprezintă $75\%$ din energia totală? Fie $h_{max}$ înălțimea maximă.',
  3,
  '{"A": "La $h = 0.25 \\cdot h_{max}$", "B": "La $h = 0.5 \\cdot h_{max}$", "C": "La $h = 0.75 \\cdot h_{max}$", "D": "La $h = 0.33 \\cdot h_{max}$", "E": "La $h = 0.1 \\cdot h_{max}$", "F": "La $h = 0.9 \\cdot h_{max}$"}'::jsonb,
  'A'
),

-- ==========================================
-- GRAVITAȚIE ȘI SATELIȚI
-- ==========================================

(
  'FIZ-IX-018',
  9,
  'Care este accelerația gravitațională la o altitudine egală cu raza Pământului? Se dă $g_0 = 10 \, \text{m/s}^2$ la suprafața Pământului.',
  3,
  '{"A": "$g = 5 \\, \\text{m/s}^2$", "B": "$g = 2.5 \\, \\text{m/s}^2$", "C": "$g = 10 \\, \\text{m/s}^2$", "D": "$g = 7.5 \\, \\text{m/s}^2$", "E": "$g = 1.1 \\, \\text{m/s}^2$", "F": "$g = 3.3 \\, \\text{m/s}^2$"}'::jsonb,
  'B'
),

(
  'FIZ-IX-019',
  9,
  'Un corp cântărește $600 \, \text{N}$ pe Pământ. Care este greutatea sa pe Lună, știind că accelerația gravitațională pe Lună este de $6$ ori mai mică decât pe Pământ?',
  2,
  '{"A": "$G_L = 100 \\, \\text{N}$", "B": "$G_L = 60 \\, \\text{N}$", "C": "$G_L = 3600 \\, \\text{N}$", "D": "$G_L = 300 \\, \\text{N}$", "E": "$G_L = 50 \\, \\text{N}$", "F": "$G_L = 120 \\, \\text{N}$"}'::jsonb,
  'A'
),

-- ==========================================
-- HIDROSTATICĂ ȘI PRESIUNE
-- ==========================================

(
  'FIZ-IX-020',
  9,
  'Care este presiunea hidrostatică la adâncimea $h = 50 \, \text{m}$ într-un lac? Se dă densitatea apei $\rho = 1000 \, \text{kg/m}^3$ și $g = 10 \, \text{m/s}^2$.',
  2,
  '{"A": "$p = 5 \\cdot 10^5 \\, \\text{Pa}$", "B": "$p = 5 \\cdot 10^4 \\, \\text{Pa}$", "C": "$p = 500 \\, \\text{Pa}$", "D": "$p = 5 \\cdot 10^6 \\, \\text{Pa}$", "E": "$p = 5000 \\, \\text{Pa}$", "F": "$p = 50 \\, \\text{Pa}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-021',
  9,
  'Un cub de lemn cu latura $a = 10 \, \text{cm}$ și densitatea $\rho_l = 600 \, \text{kg/m}^3$ plutește în apă ($\rho_a = 1000 \, \text{kg/m}^3$). Ce fracțiune din volum este scufundată?',
  2,
  '{"A": "$60\\%$", "B": "$40\\%$", "C": "$80\\%$", "D": "$50\\%$", "E": "$75\\%$", "F": "$25\\%$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-022',
  9,
  'Un corp cu volumul $V = 0.002 \, \text{m}^3$ este complet scufundat în apă. Care este forța arhimedică? Se dă $\rho_{apă} = 1000 \, \text{kg/m}^3$ și $g = 10 \, \text{m/s}^2$.',
  2,
  '{"A": "$F_A = 20 \\, \\text{N}$", "B": "$F_A = 200 \\, \\text{N}$", "C": "$F_A = 2 \\, \\text{N}$", "D": "$F_A = 2000 \\, \\text{N}$", "E": "$F_A = 0.2 \\, \\text{N}$", "F": "$F_A = 50 \\, \\text{N}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-023',
  9,
  'Un vas cilindric conține mercur ($\rho_{Hg} = 13600 \, \text{kg/m}^3$) și apă ($\rho_a = 1000 \, \text{kg/m}^3$). Înălțimea coloanei de mercur este $h_1 = 10 \, \text{cm}$ și a apei $h_2 = 27.2 \, \text{cm}$. Care este presiunea la fundul vasului? Se dă $g = 10 \, \text{m/s}^2$.',
  3,
  '{"A": "$p \\approx 16320 \\, \\text{Pa}$", "B": "$p \\approx 3720 \\, \\text{Pa}$", "C": "$p \\approx 13600 \\, \\text{Pa}$", "D": "$p \\approx 10000 \\, \\text{Pa}$", "E": "$p \\approx 20000 \\, \\text{Pa}$", "F": "$p \\approx 8000 \\, \\text{Pa}$"}'::jsonb,
  'A'
),

-- ==========================================
-- PROBLEME MIXTE AVANSATE
-- ==========================================

(
  'FIZ-IX-024',
  9,
  'Un corp cu masa $m = 1 \, \text{kg}$ pornește din repaus și alunecă fără frecare de pe un plan înclinat cu înălțimea $h = 5 \, \text{m}$. Cu ce viteză ajunge la baza planului? Se dă $g = 10 \, \text{m/s}^2$.',
  2,
  '{"A": "$v = 10 \\, \\text{m/s}$", "B": "$v = 5 \\, \\text{m/s}$", "C": "$v = 50 \\, \\text{m/s}$", "D": "$v = 7.07 \\, \\text{m/s}$", "E": "$v = 15 \\, \\text{m/s}$", "F": "$v = 20 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-025',
  9,
  'Un lift coboară cu accelerația $a = 2 \, \text{m/s}^2$. Care este greutatea aparentă a unui corp cu masa $m = 50 \, \text{kg}$ aflat în lift? Se dă $g = 10 \, \text{m/s}^2$.',
  3,
  '{"A": "$G_{ap} = 400 \\, \\text{N}$", "B": "$G_{ap} = 500 \\, \\text{N}$", "C": "$G_{ap} = 600 \\, \\text{N}$", "D": "$G_{ap} = 300 \\, \\text{N}$", "E": "$G_{ap} = 100 \\, \\text{N}$", "F": "$G_{ap} = 250 \\, \\text{N}$"}'::jsonb,
  'A'
);

-- Verificare: Această comandă va afișa numărul de grile pentru clasa a IX-a
-- SELECT COUNT(*) as total_grile_clasa_9 FROM quiz_questions WHERE class = 9;
