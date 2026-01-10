-- Geometric Optics Concepts for Knowledge Graph
-- Run this AFTER knowledge-graph.sql to add optics nodes
-- Updated with UNIQUE IDs (starting with 9) to avoid conflict with Electricity (d/e/f)

-- Insert optics nodes
INSERT INTO knowledge_nodes (id, title, type, explanation, formula, intuition, common_mistake, difficulty) VALUES
  -- Basic optics concepts
  ('91919191-9191-9191-9191-919191919191', 'Lumină', 'concept', 
   'Lumina este o undă electromagnetică care poate fi percepută de ochiul uman. În optica geometrică, lumina se propagă în linie dreaptă.',
   NULL,
   'Lumina e cea mai rapidă "mesageră" din univers - nimic nu poate depăși viteza ei în vid.',
   'Lumina are natură duală: se comportă ca undă (difracție, interferență) și ca particulă (foton, efect fotoelectric).',
   'basic'),
   
  ('92929292-9292-9292-9292-929292929292', 'Rază de lumină', 'concept',
   'Raza de lumină este o linie care indică direcția de propagare a luminii. Este un model simplificat folosit în optica geometrică.',
   NULL,
   'E ca o săgeată care arată încotro "merge" lumina - util pentru a înțelege reflexia și refracția.',
   'Razele de lumină sunt doar un model matematic - lumina reală e o undă cu lățime finită.',
   'basic'),

  ('93939393-9393-9393-9393-939393939393', 'Mediu optic', 'concept',
   'Un mediu optic este orice substanță prin care lumina se poate propaga (aer, apă, sticlă, vid).',
   NULL,
   'Fiecare mediu "încetinește" lumina diferit - asta determină efectele optice.',
   'Vidul nu e un "mediu" propriu-zis, dar lumina se propagă cel mai rapid în vid.',
   'basic'),

  ('94949494-9494-9494-9494-949494949494', 'Indice de refracție', 'concept',
   'Indicele de refracție (n) al unui mediu arată de câte ori lumina e mai lentă în acel mediu față de vid.',
   NULL,
   'Cu cât indicele e mai mare, cu atât lumina e mai "încetinită" - sticla (n≈1.5) încetinește mai mult ca apa (n≈1.33).',
   'Indicele de refracție depinde și de lungimea de undă - de aceea prisma descompune lumina albă în curcubeu.',
   'basic'),

  -- Reflection
  ('95959595-9595-9595-9595-959595959595', 'Reflexia luminii', 'concept',
   'Reflexia este fenomenul prin care lumina revine în primul mediu când întâlnește suprafața de separare dintre două medii.',
   NULL,
   'Ca o minge care sare de pe perete - lumina "sare înapoi" de pe oglindă.',
   'Reflexia are loc întotdeauna, chiar și când există refracție - o parte din lumină se reflectă mereu.',
   'basic'),

  ('96969696-9696-9696-9696-969696969696', 'Legile reflexiei', 'formula',
   'Unghiul de incidență este egal cu unghiul de reflexie, și raza incidentă, normala și raza reflectată sunt în același plan.',
   E'i = r',
   'Cum intră, așa iese - dar în partea opusă a normalei.',
   'Unghiurile se măsoară față de normală (perpendiculara pe suprafață), nu față de suprafață!',
   'basic'),

  -- Refraction
  ('97979797-9797-9797-9797-979797979797', 'Refracția luminii', 'concept',
   'Refracția este schimbarea direcției de propagare a luminii când trece dintr-un mediu în altul cu indice de refracție diferit.',
   NULL,
   'E ca roțile unei mașini care intră în nisip - partea care intră prima încetinește, făcând mașina să vireze.',
   'Refracția are loc doar când lumina trece OBLIC dintr-un mediu în altul. Perpendicular, nu se deviază.',
   'basic'),

  ('98989898-9898-9898-9898-989898989898', 'Legea lui Snell', 'formula',
   'Legea fundamentală a refracției: produsul dintre indicele de refracție și sinusul unghiului este constant.',
   E'n_1 \\sin(i) = n_2 \\sin(r)',
   'Cu cât mediul 2 e mai dens optic (n mai mare), cu atât raza se apropie mai mult de normală.',
   'Când lumina trece în mediu mai puțin dens, se îndepărtează de normală - poate ajunge la reflexie totală.',
   'intermediate'),

  ('99999999-9999-9999-9999-999999999999', 'Reflexia totală internă', 'concept',
   'Când lumina trece din mediu mai dens în mediu mai puțin dens și unghiul de incidență depășește unghiul limită, toată lumina se reflectă.',
   NULL,
   'Fibrele optice funcționează pe acest principiu - lumina rămâne "captivă" în fibră prin reflexii totale.',
   'Reflexia totală are loc DOAR când lumina merge din mediu mai dens spre mediu mai puțin dens.',
   'intermediate'),

  ('9a9a9a9a-9a9a-9a9a-9a9a-9a9a9a9a9a9a', 'Unghiul limită', 'formula',
   'Unghiul de incidență pentru care unghiul de refracție devine 90°. Deasupra acestui unghi, are loc reflexie totală.',
   E'\\sin(l) = \\frac{n_2}{n_1}',
   'E "pragul" peste care lumina nu mai poate ieși din mediul dens - rămâne captivă.',
   'Formula e valabilă doar când n₁ > n₂. Dacă n₁ < n₂, nu există unghi limită.',
   'intermediate'),

  -- Mirrors
  ('9b9b9b9b-9b9b-9b9b-9b9b-9b9b9b9b9b9b', 'Oglinda plană', 'concept',
   'Oglinda plană formează imagini virtuale, drepte și de aceeași mărime cu obiectul, situate simetric față de oglindă.',
   NULL,
   'Imaginea ta în oglindă e la fel de departe "în spatele" oglinzii pe cât ești tu în față.',
   'Imaginea în oglinda plană este inversată stânga-dreapta, nu sus-jos.',
   'basic'),

  ('9c9c9c9c-9c9c-9c9c-9c9c-9c9c9c9c9c9c', 'Oglinda sferică concavă', 'concept',
   'Oglinda concavă are suprafața reflectorizantă pe partea interioară a sferei. Poate forma imagini reale sau virtuale.',
   NULL,
   'Ca o farfurie adâncă care concentrează lumina - folosită la faruri, telescoape reflectoare.',
   'Poziția și tipul imaginii depind de unde e obiectul față de focar și centru.',
   'intermediate'),

  ('9d9d9d9d-9d9d-9d9d-9d9d-9d9d9d9d9d9d', 'Oglinda sferică convexă', 'concept',
   'Oglinda convexă are suprafața reflectorizantă pe partea exterioară a sferei. Formează întotdeauna imagini virtuale, drepte și micșorate.',
   NULL,
   'Ca oglinda retrovizoare - vezi un câmp mai larg, dar obiectele par mai mici și mai departe.',
   'Imaginea e întotdeauna virtuală, indiferent de poziția obiectului.',
   'intermediate'),

  ('9e9e9e9e-9e9e-9e9e-9e9e-9e9e9e9e9e9e', 'Formula oglinzilor sferice', 'formula',
   'Relația fundamentală dintre distanța obiect, distanța imagine și distanța focală pentru oglinzi sferice.',
   E'\\frac{1}{p} + \\frac{1}{p\'} = \\frac{1}{f} = \\frac{2}{R}',
   'Focarul e la jumătatea razei pentru oglinzi sferice.',
   'Convenția de semne: p'' pozitiv = imagine reală, p'' negativ = imagine virtuală.',
   'intermediate'),

  -- Lenses
  ('9f9f9f9f-9f9f-9f9f-9f9f-9f9f9f9f9f9f', 'Lentila convergentă', 'concept',
   'Lentila convergentă (convexă) este mai groasă la mijloc și concentrează razele paralele într-un punct - focarul.',
   NULL,
   'Ca o lupă - poate mări obiectele apropiate și poate aprinde hârtia concentrând lumina soarelui.',
   'Poate forma atât imagini reale (când obiectul e dincolo de focar) cât și virtuale (când obiectul e între lentilă și focar).',
   'intermediate'),

  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'Lentila divergentă', 'concept',
   'Lentila divergentă (concavă) este mai subțire la mijloc și împrăștie razele paralele - par să vină dintr-un focar virtual.',
   NULL,
   'Folosită pentru corectarea miopiei - "întinde" razele pentru a focaliza corect pe retină.',
   'Formează întotdeauna imagini virtuale, drepte și micșorate.',
   'intermediate'),

  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Formula lentilelor subțiri', 'formula',
   'Relația fundamentală dintre distanța obiect, distanța imagine și distanța focală pentru lentile subțiri.',
   E'\\frac{1}{p} + \\frac{1}{p\'} = \\frac{1}{f}',
   'Aceeași formulă ca pentru oglinzi, dar convențiile de semn diferă.',
   'Pentru lentile: f pozitiv = convergentă, f negativ = divergentă.',
   'intermediate'),

  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Mărirea laterală', 'formula',
   'Raportul dintre dimensiunea imaginii și dimensiunea obiectului. Indică de câte ori imaginea e mai mare sau mai mică.',
   E'm = -\\frac{p\'}{p} = \\frac{y\'}{y}',
   'Dacă |m| > 1, imaginea e mărită. Dacă |m| < 1, e micșorată. Semnul indică orientarea.',
   'm pozitiv = imagine dreaptă (virtuală), m negativ = imagine răsturnată (reală).',
   'intermediate'),

  ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Vergența lentilei', 'formula',
   'Vergența (puterea optică) este inversul distanței focale și se măsoară în dioptrii.',
   E'C = \\frac{1}{f}',
   'Dioptria prescrisă de oftalmolog e vergența lentilei de corecție. Valoare mare = lentilă puternică.',
   'Distanța focală trebuie să fie în metri pentru a obține dioptrii (nu în cm!).',
   'basic'),

  -- Advanced concepts
  ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'Formula constructorilor de lentile', 'formula',
   'Relația dintre vergența lentilei, indicele de refracție și razele de curbură ale suprafețelor.',
   E'C = (n-1) \\left( \\frac{1}{R_1} - \\frac{1}{R_2} \\right)',
   'Forma lentilei și materialul determină cât de puternic refractă lumina.',
   'Convențiile de semn pentru R₁ și R₂ depind de direcția curburii.',
   'advanced'),

  ('a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 'Sistemul de lentile', 'formula',
   'Pentru lentile subțiri în contact, vergența echivalentă este suma vergențelor.',
   E'C_{eq} = C_1 + C_2 + C_3 + ...',
   'Similar cu rezistențele în serie - efectele se adună.',
   'Formula e validă doar pentru lentile SUBȚIRI aflate în contact direct.',
   'advanced'),

  ('a6a6a6a6-a6a6-a6a6-a6a6-a6a6a6a6a6a6', 'Ochiul uman', 'concept',
   'Ochiul este un sistem optic complex cu lentilă convergentă (cristalinul) și ecran (retina). Acomodarea permite focalizarea la distanțe diferite.',
   NULL,
   'Cristalinul își schimbă forma pentru a focaliza - similar cu autofocusul camerei.',
   'La miopie, imaginea se formează în fața retinei. La hipermetropie, în spatele retinei.',
   'intermediate'),

  ('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 'Dispersia luminii', 'concept',
   'Dispersia este fenomenul de descompunere a luminii albe în culorile componente, datorită variației indicelui de refracție cu lungimea de undă.',
   NULL,
   'Curcubeul și efectul prismei - roșul se deviază mai puțin, violetul mai mult.',
   'Indicele de refracție variază cu culoarea: n_violet > n_roșu în majoritatea materialelor.',
   'intermediate')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  explanation = EXCLUDED.explanation,
  formula = EXCLUDED.formula,
  intuition = EXCLUDED.intuition,
  common_mistake = EXCLUDED.common_mistake,
  difficulty = EXCLUDED.difficulty;

-- Insert edges connecting optics concepts
INSERT INTO knowledge_edges (source_node_id, target_node_id) VALUES
  -- Lumina conectată cu rază, viteză și mediu optic
  ('91919191-9191-9191-9191-919191919191', '92929292-9292-9292-9292-929292929292'),
  ('91919191-9191-9191-9191-919191919191', '93939393-9393-9393-9393-939393939393'),
  ('91919191-9191-9191-9191-919191919191', '77777777-7777-7777-7777-777777777777'),
  
  -- Mediu optic conectat cu indice de refracție
  ('93939393-9393-9393-9393-939393939393', '94949494-9494-9494-9494-949494949494'),
  
  -- Indice de refracție conectat cu refracție și legea lui Snell
  ('94949494-9494-9494-9494-949494949494', '97979797-9797-9797-9797-979797979797'),
  ('94949494-9494-9494-9494-949494949494', '98989898-9898-9898-9898-989898989898'),
  
  -- Reflexia conectată cu legile reflexiei și oglinzi
  ('95959595-9595-9595-9595-959595959595', '96969696-9696-9696-9696-969696969696'),
  ('95959595-9595-9595-9595-959595959595', '9b9b9b9b-9b9b-9b9b-9b9b-9b9b9b9b9b9b'),
  
  -- Refracția conectată cu legea lui Snell și reflexie totală
  ('97979797-9797-9797-9797-979797979797', '98989898-9898-9898-9898-989898989898'),
  ('97979797-9797-9797-9797-979797979797', '99999999-9999-9999-9999-999999999999'),
  
  -- Reflexie totală conectată cu unghi limită
  ('99999999-9999-9999-9999-999999999999', '9a9a9a9a-9a9a-9a9a-9a9a-9a9a9a9a9a9a'),
  
  -- Oglinzile conectate între ele și cu formula oglinzilor
  ('9b9b9b9b-9b9b-9b9b-9b9b-9b9b9b9b9b9b', '9c9c9c9c-9c9c-9c9c-9c9c-9c9c9c9c9c9c'),
  ('9c9c9c9c-9c9c-9c9c-9c9c-9c9c9c9c9c9c', '9d9d9d9d-9d9d-9d9d-9d9d-9d9d9d9d9d9d'),
  ('9c9c9c9c-9c9c-9c9c-9c9c-9c9c9c9c9c9c', '9e9e9e9e-9e9e-9e9e-9e9e-9e9e9e9e9e9e'),
  ('9d9d9d9d-9d9d-9d9d-9d9d-9d9d9d9d9d9d', '9e9e9e9e-9e9e-9e9e-9e9e-9e9e9e9e9e9e'),
  
  -- Lentilele conectate între ele și cu formula lentilelor
  ('9f9f9f9f-9f9f-9f9f-9f9f-9f9f9f9f9f9f', 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0'),
  ('9f9f9f9f-9f9f-9f9f-9f9f-9f9f9f9f9f9f', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  
  -- Formula lentilelor conectată cu mărirea și vergența
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'),
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'),
  
  -- Vergența conectată cu formula constructorilor
  ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4'),
  ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5'),
  
  -- Ochiul uman conectat cu lentile și acomodare
  ('a6a6a6a6-a6a6-a6a6-a6a6-a6a6a6a6a6a6', '9f9f9f9f-9f9f-9f9f-9f9f-9f9f9f9f9f9f'),
  ('a6a6a6a6-a6a6-a6a6-a6a6-a6a6a6a6a6a6', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'),
  
  -- Dispersia conectată cu indice de refracție și culori
  ('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', '94949494-9494-9494-9494-949494949494'),
  ('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', '97979797-9797-9797-9797-979797979797'),
  
  -- Lentilele conectate cu refracția
  ('9f9f9f9f-9f9f-9f9f-9f9f-9f9f9f9f9f9f', '97979797-9797-9797-9797-979797979797'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', '97979797-9797-9797-9797-979797979797')
ON CONFLICT (source_node_id, target_node_id) DO NOTHING;
