-- Thermodynamics Concepts for Knowledge Graph
-- Run this AFTER knowledge-graph.sql to add thermodynamics nodes

-- Insert thermodynamics nodes
INSERT INTO knowledge_nodes (id, title, type, explanation, formula, intuition, common_mistake, difficulty) VALUES
  -- Basic thermodynamics concepts
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Temperatură', 'concept', 
   'Temperatura este o mărime fizică care măsoară gradul de încălzire al unui corp. Este legată de energia cinetică medie a particulelor.',
   NULL,
   'Cu cât un obiect este mai cald, cu atât particulele lui se mișcă mai repede.',
   'Temperatura nu este același lucru cu căldura. Căldura este energie transferată, temperatura măsoară "intensitatea" acestei energii.',
   'basic'),
   
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Căldură', 'concept',
   'Căldura este energia transferată între sisteme datorită diferenței de temperatură. Se notează cu Q.',
   NULL,
   'Gândește-te la căldură ca la o "transfuzie" de energie - curge de la corpul cald la cel rece.',
   'Căldura nu este stocată în corp. Un corp nu "conține" căldură, ci energie internă. Căldura este doar transferul acestei energii.',
   'basic'),

  ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Energie internă', 'concept',
   'Energia internă este suma energiilor cinetice și potențiale ale tuturor particulelor din sistem. Se notează cu U.',
   NULL,
   'E ca suma banilor din toate portofelele - fiecare particulă contribuie cu energia ei la total.',
   'Energia internă depinde doar de starea sistemului (T, P, V), nu de cum a ajuns acolo.',
   'basic'),

  ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'Presiune', 'concept',
   'Presiunea este forța exercitată pe unitatea de suprafață. În gaze, provine din ciocnirile moleculelor cu pereții.',
   NULL,
   'Imaginează-ți bile de biliard care lovesc constant pereții - fiecare lovitură contribuie la presiune.',
   'Presiunea unui gaz perfect depinde doar de numărul de particule și temperatura, nu de tipul moleculelor.',
   'basic'),

  ('a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 'Volum', 'concept',
   'Volumul este spațiul ocupat de un sistem termodinamic. Pentru gaze, volumul poate varia ușor.',
   NULL,
   'Gazele sunt "elastice" - își ocupă tot volumul disponibil și pot fi comprimate sau expandate.',
   'Volumul unui gaz nu este constant ca la solide - variază cu temperatura și presiunea.',
   'basic'),

  -- Basic thermodynamics formulas
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Ecuația calorimetrică', 'formula',
   'Căldura absorbită sau cedată de un corp este proporțională cu masa, căldura specifică și variația de temperatură.',
   E'Q = m \\cdot c \\cdot \\Delta T',
   'De aceea metalele se încălzesc repede (c mic) iar apa lent (c mare) - căldura specifică contează!',
   'Semnul lui Q contează: pozitiv când corpul primește căldură, negativ când cedează.',
   'basic'),

  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Ecuația de stare a gazului ideal', 'formula',
   'Legea fundamentală care leagă presiunea, volumul și temperatura unui gaz ideal. Constanta R este universală.',
   E'p \\cdot V = \\nu \\cdot R \\cdot T',
   'Este ca o balanță cu trei brațe: dacă schimbi unul, celelalte se ajustează pentru a menține egalitatea.',
   'Temperatura trebuie să fie în Kelvin (T = t°C + 273). Cu Celsius nu funcționează!',
   'intermediate'),

  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'Energia cinetică medie a moleculelor', 'formula',
   'Energia cinetică medie a unei molecule de gaz ideal este proporțională cu temperatura absolută.',
   E'E_c = \\frac{3}{2} k_B T',
   'Temperatura măsoară de fapt cât de "agitate" sunt moleculele - mai cald înseamnă mișcare mai rapidă.',
   'Această relație este valabilă doar pentru gaze ideale monoatomice. Moleculele cu mai multe atome au și energie de rotație.',
   'intermediate'),

  -- Intermediate formulas
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Principiul I al termodinamicii', 'formula',
   'Variația energiei interne este egală cu căldura primită minus lucrul mecanic efectuat de sistem.',
   E'\\Delta U = Q - L',
   'E ca un cont bancar: energia internă crește când primești căldură (Q) și scade când faci lucru mecanic (L).',
   'Convenția de semne contează: L este pozitiv când gazul se expansionează (face lucru mecanic).',
   'intermediate'),

  ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'Lucru mecanic în expansiune', 'formula',
   'Lucrul mecanic efectuat de un gaz care își schimbă volumul la presiune constantă.',
   E'L = p \\cdot \\Delta V',
   'Când un gaz se expandează, "împinge" pistonul - face lucru mecanic asupra mediului exterior.',
   'Formula simplă e valabilă doar la presiune constantă (transformare izobară).',
   'intermediate'),

  ('b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'Variația energiei interne', 'formula',
   'Pentru un gaz ideal, variația energiei interne depinde doar de variația temperaturii.',
   E'\\Delta U = \\nu \\cdot C_V \\cdot \\Delta T',
   'Energia internă a gazului ideal depinde DOAR de temperatură - nu contează presiunea sau volumul.',
   'Cv este căldura molară la volum constant. Pentru gaz monoatomic ideal: Cv = 3R/2.',
   'intermediate'),

  -- Thermodynamic transformations
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Transformare izotermă', 'formula',
   'Transformare în care temperatura rămâne constantă. Pentru gaz ideal, pV = constant.',
   'p_1 V_1 = p_2 V_2',
   'Imaginează-ți un cilindru în contact termic cu un termostat - energia primită ca lucru este cedată ca căldură.',
   'La transformare izotermă, ΔU = 0 (temperatura constantă), deci Q = L.',
   'intermediate'),

  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Transformare izobară', 'formula',
   'Transformare la presiune constantă. Volumul variază proporțional cu temperatura.',
   E'\\frac{V_1}{T_1} = \\frac{V_2}{T_2}',
   'Un balon de gaz se umflă când îl încălzești - presiunea e menținută constantă de atmosferă.',
   'La încălzire izobară, gazul se expansionează și face lucru mecanic L = pΔV.',
   'intermediate'),

  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Transformare izocorică', 'formula',
   'Transformare la volum constant. Presiunea variază proporțional cu temperatura.',
   E'\\frac{p_1}{T_1} = \\frac{p_2}{T_2}',
   'O marmită sub presiune: volumul e fix, temperatura crește, presiunea crește.',
   'La volum constant, L = 0 (nu există expansiune), deci toată căldura devine energie internă: ΔU = Q.',
   'intermediate'),

  ('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'Transformare adiabatică', 'formula',
   'Transformare fără schimb de căldură cu exteriorul (Q = 0). Temperatura variază în timpul procesului.',
   E'p V^\\gamma = const',
   'O pompă de bicicletă se încălzește când comprimi aerul rapid - nu are timp să cedeze căldură.',
   'γ = Cp/Cv (raportul căldurilor molare). Pentru gaz monoatomic γ = 5/3.',
   'advanced'),

  -- Advanced concepts
  ('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'Randamentul mașinii termice', 'formula',
   'Randamentul este raportul dintre lucrul mecanic util și căldura primită de la sursa caldă.',
   E'\\eta = \\frac{L}{Q_1} = 1 - \\frac{Q_2}{Q_1}',
   'Nicio mașină termică nu poate transforma toată căldura în lucru - parte din ea trebuie cedată.',
   'Randamentul maxim este cel al ciclului Carnot: η_Carnot = 1 - T_rece/T_cald.',
   'advanced'),

  ('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6', 'Ciclu Carnot', 'formula',
   'Ciclul termodinamic reversibil cu randament maxim, format din 2 izoterme și 2 adiabatice.',
   E'\\eta_{Carnot} = 1 - \\frac{T_2}{T_1}',
   'Este "limita teoretică" pentru eficiența mașinilor termice - imposibil de atins în practică.',
   'Temperaturile trebuie să fie în Kelvin. Cu cât diferența de temperatură e mai mare, cu atât randamentul e mai bun.',
   'advanced');

-- Insert edges connecting thermodynamics concepts
INSERT INTO knowledge_edges (source_node_id, target_node_id) VALUES
  -- Temperatura conectată cu căldura și energie internă
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'),
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'),
  
  -- Căldura conectată cu energie internă și ecuația calorimetrică
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'),
  
  -- Ecuația calorimetrică conectată cu temperatură
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '22222222-2222-2222-2222-222222222222'),
  
  -- Ecuația de stare conectată cu presiune, volum, temperatură
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  
  -- Energia cinetică medie conectată cu temperatură și energie cinetică
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', '66666666-6666-6666-6666-666666666666'),
  
  -- Principiul I conectat cu energie internă, căldură, lucru mecanic
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  
  -- Lucru mecanic în expansiune conectat cu presiune, volum
  ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4'),
  ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5'),
  ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  
  -- Variația energiei interne conectată cu energie internă, temperatură
  ('b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'),
  ('b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  
  -- Transformări termodinamice conectate între ele și cu ecuația de stare
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'),
  ('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'),
  
  -- Transformările conectate cu principiul I
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4'),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4'),
  ('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4'),
  
  -- Randament și ciclu Carnot
  ('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6'),
  ('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'),
  ('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  
  -- Ciclu Carnot conectat cu transformări
  ('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'),
  ('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6', 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4'),
  
  -- Presiune și volum conectate
  ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5'),
  
  -- Conectare cu forță (presiunea e forță pe suprafață)
  ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', '11111111-1111-1111-1111-111111111111');
