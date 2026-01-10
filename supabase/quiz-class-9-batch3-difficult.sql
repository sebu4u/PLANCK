-- ==========================================
-- GRILE DIFICILE - CLASA A IX-A (BATCH 3)
-- Probleme de nivel ridicat pentru admitere și competiții
-- 20 întrebări dificile (FIZ-IX-046 până la FIZ-IX-065)
-- ==========================================

-- Teme acoperite:
-- - Cinematică avansată (analiză grafică, mișcare pe plan înclinat)
-- - Dinamică complexă (sisteme de corpuri, forțe variabile)
-- - Lucru mecanic și energie (transformări complexe)
-- - Impuls și conservarea cantității de mișcare (ciocniri în 2D)
-- - Mișcare circulară (condiții limite, forțe variabile)
-- - Gravitație (sateliți, energie orbitală)
-- - Echilibru static (centre de greutate, echilibru instabil)
-- - Hidrostatică avansată (vase comunicante, flotare complexă)

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES

-- ==========================================
-- CINEMATICĂ AVANSATĂ
-- ==========================================

(
  'FIZ-IX-046',
  9,
  'Pe graficul viteză-timp pentru un mobil, într-un interval de timp aria sub curbă este $A = 120 \, \text{m}$. Dacă mobilul urcă pe un plan înclinat cu unghiul $\alpha = 30°$, care este variația înălțimii sale? Se dă $\sin 30° = 0.5$.',
  4,
  '{"A": "$\\Delta h = 60 \\, \\text{m}$", "B": "$\\Delta h = 120 \\, \\text{m}$", "C": "$\\Delta h = 104 \\, \\text{m}$", "D": "$\\Delta h = 30 \\, \\text{m}$", "E": "$\\Delta h = 240 \\, \\text{m}$", "F": "$\\Delta h = 45 \\, \\text{m}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-047',
  9,
  'Două mobile pornesc simultan din același punct și se deplasează cu accelerațiile constante $a_1 = 2 \, \text{m/s}^2$ și $a_2 = 4 \, \text{m/s}^2$ în aceeași direcție. Primul mobil are viteza inițială $v_1 = 10 \, \text{m/s}$, iar al doilea pornește din repaus. După cât timp distanța dintre ele este maximă?',
  4,
  '{"A": "$t = 5 \\, \\text{s}$", "B": "$t = 2.5 \\, \\text{s}$", "C": "$t = 10 \\, \\text{s}$", "D": "$t = 7.5 \\, \\text{s}$", "E": "$t = 3.33 \\, \\text{s}$", "F": "$t = 1 \\, \\text{s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-048',
  9,
  'Un corp este aruncat orizontal de la înălțimea $h = 80 \, \text{m}$ cu viteza $v_0 = 30 \, \text{m/s}$. Care este viteza finală (modulul) când atinge solul? Se dă $g = 10 \, \text{m/s}^2$ și se neglijează rezistența aerului.',
  4,
  '{"A": "$v = 50 \\, \\text{m/s}$", "B": "$v = 40 \\, \\text{m/s}$", "C": "$v = 30 \\, \\text{m/s}$", "D": "$v = 60 \\, \\text{m/s}$", "E": "$v = 70 \\, \\text{m/s}$", "F": "$v = 45 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-049',
  9,
  'Un corp cade liber dintr-un punct $A$ și trece pe lângă punctul $B$ cu viteza $v_B = 20 \, \text{m/s}$. După încă $t = 2 \, \text{s}$ ajunge la sol. Care este distanța dintre punctul $B$ și sol? Se dă $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "$h = 60 \\, \\text{m}$", "B": "$h = 40 \\, \\text{m}$", "C": "$h = 80 \\, \\text{m}$", "D": "$h = 50 \\, \\text{m}$", "E": "$h = 100 \\, \\text{m}$", "F": "$h = 20 \\, \\text{m}$"}'::jsonb,
  'A'
),

-- ==========================================
-- DINAMICĂ COMPLEXĂ
-- ==========================================

(
  'FIZ-IX-050',
  9,
  'Două blocuri cu masele $m_1 = 3 \, \text{kg}$ și $m_2 = 2 \, \text{kg}$ sunt legate printr-un fir inextensibil care trece peste un scripete fix fără masă și fără frecare. Sistemul este lăsat liber. Care este accelerația sistemului? Se dă $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "$a = 2 \\, \\text{m/s}^2$", "B": "$a = 5 \\, \\text{m/s}^2$", "C": "$a = 10 \\, \\text{m/s}^2$", "D": "$a = 4 \\, \\text{m/s}^2$", "E": "$a = 1 \\, \\text{m/s}^2$", "F": "$a = 6 \\, \\text{m/s}^2$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-051',
  9,
  'Un corp cu masa $m = 10 \, \text{kg}$ coboară pe un plan înclinat cu accelerația $a = 4 \, \text{m/s}^2$. Unghiul planului cu orizontala este $\alpha = 30°$. Care este coeficientul de frecare? Se dă $g = 10 \, \text{m/s}^2$ și $\cos 30° \approx 0.87$.',
  4,
  '{"A": "$\\mu \\approx 0.12$", "B": "$\\mu \\approx 0.2$", "C": "$\\mu \\approx 0.3$", "D": "$\\mu \\approx 0.5$", "E": "$\\mu \\approx 0.15$", "F": "$\\mu \\approx 0.4$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-052',
  9,
  'Trei corpuri cu masele $m_1 = 2 \, \text{kg}$, $m_2 = 3 \, \text{kg}$ și $m_3 = 5 \, \text{kg}$ sunt așezate pe o suprafață orizontală și sunt împinse de o forță $F = 50 \, \text{N}$ aplicată asupra corpului $m_1$. Care este forța pe care corpul $m_2$ o exercită asupra corpului $m_3$? Se neglijează frecarea.',
  4,
  '{"A": "$F_{23} = 25 \\, \\text{N}$", "B": "$F_{23} = 30 \\, \\text{N}$", "C": "$F_{23} = 20 \\, \\text{N}$", "D": "$F_{23} = 16.67 \\, \\text{N}$", "E": "$F_{23} = 35 \\, \\text{N}$", "F": "$F_{23} = 40 \\, \\text{N}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-053',
  9,
  'Un corp cu masa $m = 5 \, \text{kg}$ este tras pe un plan orizontal cu o forță variabilă care crește liniar de la $F_0 = 0$ la $F_{max} = 60 \, \text{N}$ în intervalul de timp $t = 6 \, \text{s}$. Coeficientul de frecare cinetică este $\mu = 0.2$. În ce moment începe corpul să se miște? Se dă $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "$t = 1 \\, \\text{s}$", "B": "$t = 2 \\, \\text{s}$", "C": "$t = 3 \\, \\text{s}$", "D": "$t = 0.5 \\, \\text{s}$", "E": "$t = 1.5 \\, \\text{s}$", "F": "$t = 4 \\, \\text{s}$"}'::jsonb,
  'A'
),

-- ==========================================
-- LUCRU MECANIC ȘI ENERGIE
-- ==========================================

(
  'FIZ-IX-054',
  9,
  'Un resort cu constanta elastică $k = 400 \, \text{N/m}$ este comprimat cu $\Delta x = 0.5 \, \text{m}$. Resortul este relaxat și împinge un corp cu masa $m = 2 \, \text{kg}$ pe o suprafață orizontală. Ce distanță parcurge corpul dacă $\mu = 0.25$? Se dă $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "$d = 10 \\, \\text{m}$", "B": "$d = 5 \\, \\text{m}$", "C": "$d = 20 \\, \\text{m}$", "D": "$d = 15 \\, \\text{m}$", "E": "$d = 8 \\, \\text{m}$", "F": "$d = 25 \\, \\text{m}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-055',
  9,
  'Un corp cu masa $m = 4 \, \text{kg}$ alunecă fără frecare de pe un plan înclinat cu înălțimea $h = 5 \, \text{m}$ și apoi parcurge o porțiune orizontală cu lungimea $L = 10 \, \text{m}$ unde $\mu = 0.4$. Se oprește corpul pe porțiunea orizontală? Se dă $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "Nu, parcurge mai mult decât $L$", "B": "Da, se oprește după $8 \\, \\text{m}$", "C": "Da, se oprește după $5 \\, \\text{m}$", "D": "Da, se oprește exact la capătul lui $L$", "E": "Nu se poate determina", "F": "Da, se oprește după $2 \\, \\text{m}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-056',
  9,
  'Un corp de masă $m = 3 \, \text{kg}$ se deplasează sub acțiunea unei forțe $F = 30 \, \text{N}$ care formează un unghi variabil cu direcția de mișcare. Pe o distanță $d = 10 \, \text{m}$, unghiul scade uniform de la $0°$ la $90°$. Care este lucrul mecanic mediu efectuat de forță?',
  4,
  '{"A": "$L \\approx 191 \\, \\text{J}$", "B": "$L = 300 \\, \\text{J}$", "C": "$L = 150 \\, \\text{J}$", "D": "$L = 0 \\, \\text{J}$", "E": "$L \\approx 212 \\, \\text{J}$", "F": "$L \\approx 100 \\, \\text{J}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-057',
  9,
  'Două corpuri cu masele $m_1 = 5 \, \text{kg}$ și $m_2 = 3 \, \text{kg}$ sunt unite printr-un resort cu constanta $k = 200 \, \text{N/m}$. Sistemul este comprimat cu $\Delta x = 0.2 \, \text{m}$ și eliberat pe o suprafață fără frecare. Care este energia cinetică a primului corp când resortul revine la lungimea naturală?',
  4,
  '{"A": "$E_{c1} = 3 \\, \\text{J}$", "B": "$E_{c1} = 4 \\, \\text{J}$", "C": "$E_{c1} = 5 \\, \\text{J}$", "D": "$E_{c1} = 2 \\, \\text{J}$", "E": "$E_{c1} = 1 \\, \\text{J}$", "F": "$E_{c1} = 6 \\, \\text{J}$"}'::jsonb,
  'A'
),

-- ==========================================
-- IMPULS ȘI CIOCNIRI COMPLEXE
-- ==========================================

(
  'FIZ-IX-058',
  9,
  'Două bile identice cu masa $m = 2 \, \text{kg}$ fiecare se deplasează perpendicular una pe cealaltă cu vitezele $v_1 = 3 \, \text{m/s}$ și $v_2 = 4 \, \text{m/s}$. Ele se ciocnesc perfect inelastic. Care este modulul vitezei sistemului după ciocnire?',
  4,
  '{"A": "$v = 2.5 \\, \\text{m/s}$", "B": "$v = 3.5 \\, \\text{m/s}$", "C": "$v = 5 \\, \\text{m/s}$", "D": "$v = 7 \\, \\text{m/s}$", "E": "$v = 1 \\, \\text{m/s}$", "F": "$v = 4 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-059',
  9,
  'Un corp cu masa $m_1 = 4 \, \text{kg}$ și viteza $v_1 = 6 \, \text{m/s}$ ciocnește elastic frontal un corp în repaus cu masa $m_2 = 2 \, \text{kg}$. Care este viteza primului corp după ciocnire?',
  4,
  '{"A": "$v_1^\\prime = 2 \\, \\text{m/s}$", "B": "$v_1^\\prime = 0 \\, \\text{m/s}$", "C": "$v_1^\\prime = -2 \\, \\text{m/s}$", "D": "$v_1^\\prime = 4 \\, \\text{m/s}$", "E": "$v_1^\\prime = 3 \\, \\text{m/s}$", "F": "$v_1^\\prime = 6 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-060',
  9,
  'O bilă cu masa $m = 0.5 \, \text{kg}$ cade vertical de la înălțimea $h = 5 \, \text{m}$ și lovește solul elastic cu coeficientul de restituție $e = 0.8$. La ce înălțime maximă va ajunge după prima rebound? Se dă $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "$h^\\prime = 3.2 \\, \\text{m}$", "B": "$h^\\prime = 4 \\, \\text{m}$", "C": "$h^\\prime = 2 \\, \\text{m}$", "D": "$h^\\prime = 2.5 \\, \\text{m}$", "E": "$h^\\prime = 5 \\, \\text{m}$", "F": "$h^\\prime = 1.6 \\, \\text{m}$"}'::jsonb,
  'A'
),

-- ==========================================
-- MIȘCARE CIRCULARĂ COMPLEXĂ
-- ==========================================

(
  'FIZ-IX-061',
  9,
  'Un corp se rotește pe un cerc vertical cu raza $r = 2 \, \text{m}$. Care este viteza minimă în punctul superior astfel încât firul să rămână întins? Se dă $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "$v_{min} \\approx 4.47 \\, \\text{m/s}$", "B": "$v_{min} = 2 \\, \\text{m/s}$", "C": "$v_{min} = 10 \\, \\text{m/s}$", "D": "$v_{min} \\approx 6.32 \\, \\text{m/s}$", "E": "$v_{min} = 20 \\, \\text{m/s}$", "F": "$v_{min} \\approx 3.16 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-IX-062',
  9,
  'Un corp se deplasează pe o suprafață cilindrică verticală cu raza $R = 5 \, \text{m}$, rotindu-se cu viteza constantă $v$. Coeficientul de frecare între corp și suprafață este $\mu = 0.3$. Care este viteza minimă pentru ca corpul să nu alunece? Se dă $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "$v_{min} \\approx 12.9 \\, \\text{m/s}$", "B": "$v_{min} = 10 \\, \\text{m/s}$", "C": "$v_{min} \\approx 7.07 \\, \\text{m/s}$", "D": "$v_{min} = 5 \\, \\text{m/s}$", "E": "$v_{min} \\approx 15 \\, \\text{m/s}$", "F": "$v_{min} = 20 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

-- ==========================================
-- GRAVITAȚIE AVANSATĂ
-- ==========================================

(
  'FIZ-IX-063',
  9,
  'Un satelit artificial se rotește în jurul Pământului pe o orbită circulară la altitudinea $h = R$ (unde $R$ este raza Pământului). Raportul dintre energia cinetică și energia potențială gravitațională (în modul) este:',
  4,
  '{"A": "$\\frac{E_c}{|E_p|} = \\frac{1}{2}$", "B": "$\\frac{E_c}{|E_p|} = 1$", "C": "$\\frac{E_c}{|E_p|} = 2$", "D": "$\\frac{E_c}{|E_p|} = \\frac{1}{4}$", "E": "$\\frac{E_c}{|E_p|} = 4$", "F": "$\\frac{E_c}{|E_p|} = \\frac{3}{2}$"}'::jsonb,
  'A'
),

-- ==========================================
-- ECHILIBRU STATIC COMPLEX
-- ==========================================

(
  'FIZ-IX-064',
  9,
  'O scară omogenă cu masa $m = 20 \, \text{kg}$ și lungimea $L = 5 \, \text{m}$ este sprijinită de un perete vertical fără frecare și un podea orizontală cu $\mu = 0.5$. Scara formează un unghi de $60°$ cu orizontala. Care este forța minimă orizontală care trebuie aplicată la baza scării pentru a împiedica alunecarea? Se dă $g = 10 \, \text{m/s}^2$ și $\tan 60° \approx 1.73$.',
  4,
  '{"A": "$F \\approx 173 \\, \\text{N}$", "B": "$F = 200 \\, \\text{N}$", "C": "$F = 100 \\, \\text{N}$", "D": "$F \\approx 86.5 \\, \\text{N}$", "E": "$F = 50 \\, \\text{N}$", "F": "$F \\approx 115 \\, \\text{N}$"}'::jsonb,
  'A'
),

-- ==========================================
-- HIDROSTATICĂ AVANSATĂ
-- ==========================================

(
  'FIZ-IX-065',
  9,
  'Un corp cântărește în aer $G_a = 30 \, \text{N}$ și în apă $G_{ap} = 20 \, \text{N}$. Care este densitatea corpului? Se dă $\rho_{ap\breve{a}} = 1000 \, \text{kg/m}^3$ și $g = 10 \, \text{m/s}^2$.',
  4,
  '{"A": "$\\rho = 3000 \\, \\text{kg/m}^3$", "B": "$\\rho = 1500 \\, \\text{kg/m}^3$", "C": "$\\rho = 2000 \\, \\text{kg/m}^3$", "D": "$\\rho = 1000 \\, \\text{kg/m}^3$", "E": "$\\rho = 4000 \\, \\text{kg/m}^3$", "F": "$\\rho = 2500 \\, \\text{kg/m}^3$"}'::jsonb,
  'A'
);

-- Verificare: Această comandă va afișa numărul total de grile pentru clasa a IX-a
-- SELECT COUNT(*) as total_grile_clasa_9 FROM quiz_questions WHERE class = 9;
