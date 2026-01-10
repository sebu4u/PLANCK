-- ==========================================
-- GRILE DIFICILE - CLASA A XII-A
-- Fizică pentru BAC și admitere
-- 20 întrebări (FIZ-XII-005 până la FIZ-XII-024)
-- ==========================================

-- Teme acoperite:
-- - Fizică atomică și nucleară
-- - Efectul fotoelectric
-- - Modelul atomic Bohr
-- - Radioactivitate și reacții nucleare
-- - Fizică cuantică de bază
-- - Relativitate restrânsă

INSERT INTO quiz_questions (question_id, class, statement, difficulty, answers, correct_answer) VALUES

-- ==========================================
-- EFECTUL FOTOELECTRIC
-- ==========================================

(
  'FIZ-XII-005',
  12,
  'Lumină monocromatică cu lungimea de undă $\lambda = 400 \, \text{nm}$ cade pe un fotocatod cu lucrul mecanic de extracție $L_{ex} = 2 \, \text{eV}$. Care este energia cinetică maximă a fotoelectronilor emiși? Se dă $h = 6.63 \times 10^{-34} \, \text{J} \cdot \text{s}$, $c = 3 \times 10^8 \, \text{m/s}$, $1 \, \text{eV} = 1.6 \times 10^{-19} \, \text{J}$.',
  3,
  '{"A": "$E_{c,max} \\approx 1.1 \\, \\text{eV}$", "B": "$E_{c,max} \\approx 0.5 \\, \\text{eV}$", "C": "$E_{c,max} \\approx 2 \\, \\text{eV}$", "D": "$E_{c,max} \\approx 3.1 \\, \\text{eV}$", "E": "$E_{c,max} \\approx 1.5 \\, \\text{eV}$", "F": "$E_{c,max} = 0$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-006',
  12,
  'Pragul fotoelectric al unui metal este $\lambda_0 = 500 \, \text{nm}$. Care este potențialul de oprire când metalul este iluminat cu lumină de lungime de undă $\lambda = 300 \, \text{nm}$? Se dă $h = 6.63 \times 10^{-34} \, \text{J} \cdot \text{s}$, $c = 3 \times 10^8 \, \text{m/s}$, $e = 1.6 \times 10^{-19} \, \text{C}$.',
  3,
  '{"A": "$U_0 \\approx 1.65 \\, \\text{V}$", "B": "$U_0 \\approx 2.5 \\, \\text{V}$", "C": "$U_0 \\approx 0.83 \\, \\text{V}$", "D": "$U_0 \\approx 3.3 \\, \\text{V}$", "E": "$U_0 \\approx 1 \\, \\text{V}$", "F": "$U_0 \\approx 4.14 \\, \\text{V}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-007',
  12,
  'Un foton cu energia $E = 5 \, \text{eV}$ lovește un electron liber în repaus (efect Compton). După ciocnire, fotonul își schimbă direcția cu $90°$. Care este energia fotonului difuzat? Se dă energia de repaus a electronului $m_e c^2 = 0.511 \, \text{MeV}$.',
  3,
  '{"A": "$E^\\prime \\approx 4.95 \\, \\text{eV}$", "B": "$E^\\prime \\approx 2.5 \\, \\text{eV}$", "C": "$E^\\prime \\approx 5 \\, \\text{eV}$", "D": "$E^\\prime \\approx 4 \\, \\text{eV}$", "E": "$E^\\prime \\approx 3 \\, \\text{eV}$", "F": "$E^\\prime \\approx 4.5 \\, \\text{eV}$"}'::jsonb,
  'A'
),

-- ==========================================
-- MODELUL ATOMIC BOHR
-- ==========================================

(
  'FIZ-XII-008',
  12,
  'În modelul Bohr al atomului de hidrogen, un electron trece de pe orbita $n = 4$ pe orbita $n = 2$. Care este lungimea de undă a fotonului emis? Se dă $R_H = 1.097 \times 10^7 \, \text{m}^{-1}$ (constanta Rydberg).',
  3,
  '{"A": "$\\lambda \\approx 486 \\, \\text{nm}$", "B": "$\\lambda \\approx 656 \\, \\text{nm}$", "C": "$\\lambda \\approx 434 \\, \\text{nm}$", "D": "$\\lambda \\approx 410 \\, \\text{nm}$", "E": "$\\lambda \\approx 122 \\, \\text{nm}$", "F": "$\\lambda \\approx 365 \\, \\text{nm}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-009',
  12,
  'Care este raportul dintre razele orbitelor $n = 3$ și $n = 1$ în modelul Bohr al atomului de hidrogen?',
  2,
  '{"A": "$r_3/r_1 = 9$", "B": "$r_3/r_1 = 3$", "C": "$r_3/r_1 = 27$", "D": "$r_3/r_1 = 6$", "E": "$r_3/r_1 = 1/9$", "F": "$r_3/r_1 = \\sqrt{3}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-010',
  12,
  'Energia de ionizare a atomului de hidrogen din starea fundamentală este $E_1 = 13.6 \, \text{eV}$. Care este energia necesară pentru a excita un atom de hidrogen din starea fundamentală în starea $n = 3$?',
  3,
  '{"A": "$E \\approx 12.09 \\, \\text{eV}$", "B": "$E \\approx 10.2 \\, \\text{eV}$", "C": "$E \\approx 13.06 \\, \\text{eV}$", "D": "$E = 13.6 \\, \\text{eV}$", "E": "$E \\approx 1.51 \\, \\text{eV}$", "F": "$E \\approx 3.4 \\, \\text{eV}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-011',
  12,
  'Un electron se află pe orbita $n = 2$ în atomul de hidrogen. Care este viteza electronului pe această orbită? Se dă: $v_1 = 2.19 \times 10^6 \, \text{m/s}$ (viteza pe prima orbită).',
  3,
  '{"A": "$v_2 \\approx 1.1 \\times 10^6 \\, \\text{m/s}$", "B": "$v_2 \\approx 4.38 \\times 10^6 \\, \\text{m/s}$", "C": "$v_2 \\approx 0.55 \\times 10^6 \\, \\text{m/s}$", "D": "$v_2 \\approx 2.19 \\times 10^6 \\, \\text{m/s}$", "E": "$v_2 \\approx 8.76 \\times 10^6 \\, \\text{m/s}$", "F": "$v_2 \\approx 0.73 \\times 10^6 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

-- ==========================================
-- FIZICĂ NUCLEARĂ
-- ==========================================

(
  'FIZ-XII-012',
  12,
  'Nucleul ${}^{238}_{92}\text{U}$ emite o particulă $\alpha$ și se transformă într-un alt nucleu. Care este nucleul rezultat?',
  2,
  '{"A": "${}^{234}_{90}\\text{Th}$", "B": "${}^{234}_{92}\\text{U}$", "C": "${}^{238}_{90}\\text{Th}$", "D": "${}^{236}_{90}\\text{Th}$", "E": "${}^{234}_{91}\\text{Pa}$", "F": "${}^{238}_{94}\\text{Pu}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-013',
  12,
  'Defectul de masă al nucleului ${}^{4}_{2}\text{He}$ este $\Delta m = 0.0304 \, \text{u}$. Care este energia de legătură a nucleului? Se dă $1 \, \text{u} = 931.5 \, \text{MeV}/c^2$.',
  3,
  '{"A": "$E_l \\approx 28.3 \\, \\text{MeV}$", "B": "$E_l \\approx 14.15 \\, \\text{MeV}$", "C": "$E_l \\approx 56.6 \\, \\text{MeV}$", "D": "$E_l \\approx 7.07 \\, \\text{MeV}$", "E": "$E_l \\approx 21.2 \\, \\text{MeV}$", "F": "$E_l \\approx 4.7 \\, \\text{MeV}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-014',
  12,
  'Timpul de înjumătățire al izotopului radioactiv ${}^{131}\text{I}$ este $T_{1/2} = 8 \, \text{zile}$. Ce fracțiune din cantitatea inițială rămâne după 24 de zile?',
  2,
  '{"A": "$N/N_0 = 1/8$", "B": "$N/N_0 = 1/4$", "C": "$N/N_0 = 1/16$", "D": "$N/N_0 = 1/2$", "E": "$N/N_0 = 1/3$", "F": "$N/N_0 = 1/6$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-015',
  12,
  'Activitatea unei probe radioactive scade de la $A_0 = 3200 \, \text{Bq}$ la $A = 200 \, \text{Bq}$ în $t = 20 \, \text{ore}$. Care este timpul de înjumătățire?',
  3,
  '{"A": "$T_{1/2} = 5 \\, \\text{ore}$", "B": "$T_{1/2} = 4 \\, \\text{ore}$", "C": "$T_{1/2} = 10 \\, \\text{ore}$", "D": "$T_{1/2} = 2.5 \\, \\text{ore}$", "E": "$T_{1/2} = 6.67 \\, \\text{ore}$", "F": "$T_{1/2} = 8 \\, \\text{ore}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-016',
  12,
  'În reacția de fuziune ${}^{2}_{1}\text{H} + {}^{3}_{1}\text{H} \rightarrow {}^{4}_{2}\text{He} + X$, care este particula $X$?',
  2,
  '{"A": "${}^{1}_{0}\\text{n}$ (neutron)", "B": "${}^{1}_{1}\\text{p}$ (proton)", "C": "${}^{0}_{-1}\\text{e}$ (electron)", "D": "${}^{0}_{+1}\\text{e}$ (pozitron)", "E": "$\\gamma$ (foton)", "F": "${}^{4}_{2}\\text{He}$ (alfa)"}'::jsonb,
  'A'
),

-- ==========================================
-- DUALITATEA UND-CORPUSCUL
-- ==========================================

(
  'FIZ-XII-017',
  12,
  'Un electron este accelerat printr-o diferență de potențial $U = 150 \, \text{V}$. Care este lungimea de undă de Broglie asociată? Se dă $h = 6.63 \times 10^{-34} \, \text{J} \cdot \text{s}$, $m_e = 9.1 \times 10^{-31} \, \text{kg}$, $e = 1.6 \times 10^{-19} \, \text{C}$.',
  3,
  '{"A": "$\\lambda \\approx 0.1 \\, \\text{nm}$", "B": "$\\lambda \\approx 1 \\, \\text{nm}$", "C": "$\\lambda \\approx 0.01 \\, \\text{nm}$", "D": "$\\lambda \\approx 10 \\, \\text{nm}$", "E": "$\\lambda \\approx 0.5 \\, \\text{nm}$", "F": "$\\lambda \\approx 5 \\, \\text{nm}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-018',
  12,
  'Un foton și un electron au aceeași lungime de undă $\lambda = 0.1 \, \text{nm}$. Care este raportul dintre energia fotonului și energia cinetică a electronului? Se dă $m_e c^2 = 0.511 \, \text{MeV}$, $hc = 1240 \, \text{eV} \cdot \text{nm}$.',
  3,
  '{"A": "$E_{foton}/E_{electron} \\approx 82$", "B": "$E_{foton}/E_{electron} = 1$", "C": "$E_{foton}/E_{electron} \\approx 10$", "D": "$E_{foton}/E_{electron} \\approx 1000$", "E": "$E_{foton}/E_{electron} \\approx 0.01$", "F": "$E_{foton}/E_{electron} \\approx 164$"}'::jsonb,
  'A'
),

-- ==========================================
-- RELATIVITATE RESTRÂNSĂ
-- ==========================================

(
  'FIZ-XII-019',
  12,
  'Un muon se deplasează cu viteza $v = 0.8c$ relativ la un observator din laborator. Durata de viață proprie a muonului este $\tau_0 = 2.2 \, \mu\text{s}$. Care este durata de viață măsurată în laborator?',
  3,
  '{"A": "$\\tau \\approx 3.67 \\, \\mu\\text{s}$", "B": "$\\tau \\approx 2.2 \\, \\mu\\text{s}$", "C": "$\\tau \\approx 1.32 \\, \\mu\\text{s}$", "D": "$\\tau \\approx 5.5 \\, \\mu\\text{s}$", "E": "$\\tau \\approx 11 \\, \\mu\\text{s}$", "F": "$\\tau \\approx 4.4 \\, \\mu\\text{s}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-020',
  12,
  'Energia totală a unei particule relativiste este $E = 2E_0$, unde $E_0$ este energia de repaus. Care este viteza particulei?',
  3,
  '{"A": "$v = \\frac{\\sqrt{3}}{2}c \\approx 0.866c$", "B": "$v = 0.5c$", "C": "$v = 0.9c$", "D": "$v = \\frac{\\sqrt{2}}{2}c \\approx 0.707c$", "E": "$v = 0.75c$", "F": "$v = 0.95c$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-021',
  12,
  'O navă spațială se deplasează cu viteza $v = 0.6c$. Care este lungimea navei măsurată de un observator de pe Pământ, dacă lungimea proprie este $L_0 = 100 \, \text{m}$?',
  3,
  '{"A": "$L = 80 \\, \\text{m}$", "B": "$L = 60 \\, \\text{m}$", "C": "$L = 100 \\, \\text{m}$", "D": "$L = 125 \\, \\text{m}$", "E": "$L = 50 \\, \\text{m}$", "F": "$L = 166.7 \\, \\text{m}$"}'::jsonb,
  'A'
),

-- ==========================================
-- PROBLEME COMPLEXE DE ADMITERE
-- ==========================================

(
  'FIZ-XII-022',
  12,
  'Un fotocatod are lucrul mecanic de extracție $L_{ex} = 4.5 \, \text{eV}$. Este iluminat cu lumină cu $\lambda = 200 \, \text{nm}$. Care este viteza maximă a fotoelectronilor emiși? Se dă $hc = 1240 \, \text{eV} \cdot \text{nm}$, $m_e = 9.1 \times 10^{-31} \, \text{kg}$, $1 \, \text{eV} = 1.6 \times 10^{-19} \, \text{J}$.',
  3,
  '{"A": "$v_{max} \\approx 8.4 \\times 10^5 \\, \\text{m/s}$", "B": "$v_{max} \\approx 1.7 \\times 10^6 \\, \\text{m/s}$", "C": "$v_{max} \\approx 4.2 \\times 10^5 \\, \\text{m/s}$", "D": "$v_{max} \\approx 5 \\times 10^5 \\, \\text{m/s}$", "E": "$v_{max} \\approx 1 \\times 10^6 \\, \\text{m/s}$", "F": "$v_{max} \\approx 2.5 \\times 10^6 \\, \\text{m/s}$"}'::jsonb,
  'A'
),

(
  'FIZ-XII-023',
  12,
  'Un atom de hidrogen excitat emite succesiv 3 fotoni revenind la starea fundamentală. De pe ce nivel a pornit atomul și care sunt posibilele lungimi de undă emise (seria Lyman, Balmer etc.)?',
  3,
  '{"A": "$n = 4$; două tranziții Balmer/Paschen + una Lyman", "B": "$n = 3$; toate Lyman", "C": "$n = 5$; toate Balmer", "D": "$n = 2$; o singură tranziție Lyman", "E": "$n = 6$; doar Paschen", "F": "$n = 4$; toate Paschen"}'::jsonb,
  'A'
),

(
  'FIZ-XII-024',
  12,
  'În reacția nucleară ${}^{14}_{7}\text{N} + {}^{4}_{2}\text{He} \rightarrow {}^{17}_{8}\text{O} + X$, care este particula $X$ și ce energie este eliberată dacă defectul de masă al reacției este $\Delta m = -0.00128 \, \text{u}$? Se dă $1 \, \text{u} = 931.5 \, \text{MeV}/c^2$.',
  3,
  '{"A": "$X = {}^{1}_{1}\\text{p}$; reacția consumă $\\approx 1.19 \\, \\text{MeV}$", "B": "$X = {}^{1}_{0}\\text{n}$; se eliberează $\\approx 1.19 \\, \\text{MeV}$", "C": "$X = {}^{1}_{1}\\text{p}$; se eliberează $\\approx 1.19 \\, \\text{MeV}$", "D": "$X = {}^{0}_{-1}\\text{e}$; reacția consumă $\\approx 0.5 \\, \\text{MeV}$", "E": "$X = \\gamma$; se eliberează $\\approx 2 \\, \\text{MeV}$", "F": "$X = {}^{1}_{0}\\text{n}$; reacția consumă $\\approx 1.19 \\, \\text{MeV}$"}'::jsonb,
  'A'
);

-- ==========================================
-- VERIFICARE
-- ==========================================
-- Rulați această comandă pentru a verifica numărul de grile pentru clasa a XII-a:
-- SELECT COUNT(*) as total_grile_clasa_12 FROM quiz_questions WHERE class = 12;
