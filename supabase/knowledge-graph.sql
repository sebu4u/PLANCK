-- Knowledge Graph System for Physics Memorization
-- Creates tables for nodes (concepts/formulas) and edges (relationships)

-- Nodes table: each node is one atomic physics idea
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('concept', 'formula')),
  explanation TEXT NOT NULL,
  formula TEXT, -- Only populated for formula type nodes
  intuition TEXT, -- Optional: helpful intuition for understanding
  common_mistake TEXT, -- Optional: common misconceptions
  difficulty TEXT CHECK (difficulty IN ('basic', 'intermediate', 'advanced')) DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edges table: explicit relationships between nodes (undirected graph)
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_nodes(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_difficulty ON knowledge_nodes(difficulty);

-- Enable RLS
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read-only access (admin-only write via service role)
DROP POLICY IF EXISTS "Public read access for knowledge_nodes" ON knowledge_nodes;
CREATE POLICY "Public read access for knowledge_nodes"
  ON knowledge_nodes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for knowledge_edges" ON knowledge_edges;
CREATE POLICY "Public read access for knowledge_edges"
  ON knowledge_edges FOR SELECT
  USING (true);

-- Seed data: Romanian physics concepts and formulas
-- Clear existing data first (for re-runs)
DELETE FROM knowledge_edges;
DELETE FROM knowledge_nodes;

-- Insert nodes
INSERT INTO knowledge_nodes (id, title, type, explanation, formula, intuition, common_mistake, difficulty) VALUES
  -- Basic concepts
  ('11111111-1111-1111-1111-111111111111', 'Forță', 'concept', 
   'Forța este o mărime fizică vectorială care descrie interacțiunea dintre corpuri. Ea poate produce accelerație, deformări sau modificări ale stării de mișcare.',
   NULL,
   'Gândește-te la forță ca la o "împingere" sau "tragere" - întotdeauna are o direcție și un sens.',
   'Forța nu este același lucru cu energia sau impulsul. Forța produce accelerație, nu viteză constantă.',
   'basic'),
   
  ('22222222-2222-2222-2222-222222222222', 'Masă', 'concept',
   'Masa este o proprietate fundamentală a corpurilor care măsoară cantitatea de materie și rezistența la schimbarea stării de mișcare (inerție).',
   NULL,
   'Cu cât un obiect are mai multă masă, cu atât este mai greu să-l pui în mișcare sau să-l oprești.',
   'Masa nu este același lucru cu greutatea. Masa rămâne constantă oriunde, greutatea variază cu gravitația.',
   'basic'),
   
  ('33333333-3333-3333-3333-333333333333', 'Accelerație', 'concept',
   'Accelerația reprezintă variația vitezei în timp. Este o mărime vectorială care arată cât de repede se schimbă viteza unui corp.',
   NULL,
   'Când apeși pedala de accelerație în mașină, simți cum te "împinge" în scaun - asta e accelerația!',
   'Accelerația poate fi negativă (decelerație) și poate exista chiar și când viteza este constantă ca mărime dar își schimbă direcția.',
   'basic'),
   
  ('77777777-7777-7777-7777-777777777777', 'Viteză', 'concept',
   'Viteza este o mărime fizică vectorială care descrie rapiditatea cu care se schimbă poziția unui corp în timp.',
   NULL,
   'Viteza îți spune nu doar cât de repede mergi, ci și în ce direcție.',
   'Viteza medie nu este la fel cu viteza instantanee. Poți avea viteză medie zero chiar dacă te-ai mișcat mult.',
   'basic'),
   
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Timp', 'concept',
   'Timpul este o mărime fizică fundamentală care măsoară durata evenimentelor și ordinea lor.',
   NULL,
   'Timpul curge întotdeauna înainte și este același pentru toți observatorii în mecanica clasică.',
   'În fizica clasică, timpul este absolut. În relativitate, timpul poate "curge" diferit pentru observatori diferiți.',
   'basic'),
   
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Distanță', 'concept',
   'Distanța este lungimea drumului parcurs de un corp, indiferent de direcție. Este o mărime scalară.',
   NULL,
   'Distanța este ca odometrul mașinii - măsoară tot drumul parcurs, inclusiv ocolurile.',
   'Distanța nu este același lucru cu deplasarea. Poți parcurge o distanță mare dar să ai deplasare zero (ex: te întorci la punctul de plecare).',
   'basic'),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deplasare', 'concept',
   'Deplasarea este vectorul care unește poziția inițială de poziția finală a unui corp.',
   NULL,
   'Deplasarea este ca o săgeată de la start la finish - contează doar unde ai început și unde ai ajuns.',
   'Deplasarea poate fi zero chiar dacă corpul s-a mișcat mult (dacă revine la punctul de plecare).',
   'basic'),

  -- Basic formulas
  ('44444444-4444-4444-4444-444444444444', 'Legea a II-a a lui Newton', 'formula',
   'Legea fundamentală a dinamicii: forța rezultantă care acționează asupra unui corp este egală cu produsul dintre masa corpului și accelerația pe care o capătă.',
   'F = m · a',
   'Cu cât forța e mai mare, cu atât accelerația e mai mare. Cu cât masa e mai mare, cu atât accelerația e mai mică pentru aceeași forță.',
   'Această lege se aplică forței rezultante, nu unei singure forțe. Trebuie să aduni vectorial toate forțele.',
   'basic'),
   
  ('55555555-5555-5555-5555-555555555555', 'Greutate', 'formula',
   'Forța cu care Pământul atrage un corp. Este egală cu produsul dintre masa corpului și accelerația gravitațională.',
   'G = m · g',
   'Greutatea este de fapt o forță - de aceea o măsurăm în Newtoni, nu în kilograme!',
   'Greutatea variază în funcție de locație (mai mică pe Lună), dar masa rămâne constantă.',
   'basic'),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Viteza medie', 'formula',
   'Viteza medie este raportul dintre distanța parcursă și timpul necesar pentru a o parcurge.',
   'v = d / t',
   'Este ca atunci când calculezi viteza medie a unei călătorii - distanța totală împărțită la timpul total.',
   'Viteza medie nu îți spune nimic despre variațiile de viteză în timpul mișcării.',
   'basic'),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Accelerația medie', 'formula',
   'Accelerația medie este raportul dintre variația vitezei și intervalul de timp în care aceasta are loc.',
   'a = Δv / Δt',
   'Îți spune cât de repede s-a schimbat viteza în medie pe parcursul mișcării.',
   'Accelerația medie poate fi zero chiar dacă au existat accelerații și decelerații pe parcurs.',
   'basic'),

  -- Intermediate concepts
  ('66666666-6666-6666-6666-666666666666', 'Energie cinetică', 'formula',
   'Energia pe care o posedă un corp datorită mișcării sale. Depinde de masă și de pătratul vitezei.',
   'Ec = ½ · m · v²',
   'De aceea loviturile la viteză mare sunt mult mai periculoase - energia crește cu pătratul vitezei!',
   'Dublarea vitezei nu dublează energia cinetică, ci o face de 4 ori mai mare.',
   'intermediate'),
   
  ('88888888-8888-8888-8888-888888888888', 'Energie potențială gravitațională', 'formula',
   'Energia stocată de un corp datorită poziției sale în câmpul gravitațional. Depinde de masă, gravitație și înălțime.',
   'Ep = m · g · h',
   'E ca un arc întins - energia e "stocată" și așteaptă să fie transformată în energie cinetică.',
   'Înălțimea h este relativă la un nivel de referință ales. Energia potențială poate fi negativă!',
   'intermediate'),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Lucru mecanic', 'formula',
   'Lucrul mecanic este energia transferată atunci când o forță deplasează un corp. Depinde de forță, deplasare și unghiul dintre ele.',
   'L = F · d · cos(α)',
   'Lucrezi mecanic când cari o cutie orizontal, dar nu când o ții nemișcată - trebuie să existe deplasare!',
   'Forța perpendiculară pe deplasare nu efectuează lucru mecanic (cos 90° = 0).',
   'intermediate'),

  ('99999999-9999-9999-9999-999999999999', 'Putere', 'formula',
   'Puterea reprezintă rapiditatea cu care se efectuează lucrul mecanic sau se transferă energia.',
   'P = L / t  sau  P = F · v',
   'Un motor puternic poate face același lucru mecanic în mai puțin timp decât unul slab.',
   'Puterea nu este același lucru cu forța. Un motor poate avea forță mare dar putere mică (dacă e lent).',
   'intermediate'),

  ('10101010-1010-1010-1010-101010101010', 'Impuls', 'concept',
   'Impulsul (cantitatea de mișcare) este produsul dintre masa unui corp și viteza sa. Este o mărime vectorială.',
   NULL,
   'Un camion lent poate avea același impuls ca o mașină rapidă - depinde de produsul m·v.',
   'Impulsul se conservă în ciocniri izolate, dar energia cinetică nu (doar în ciocniri perfect elastice).',
   'intermediate'),

  ('20202020-2020-2020-2020-202020202020', 'Impulsul forței', 'formula',
   'Impulsul forței reprezintă efectul unei forțe care acționează într-un interval de timp. Este egal cu variația cantității de mișcare.',
   'I = F · Δt = Δp',
   'De aceea airbag-urile funcționează - măresc timpul de oprire, micșorând forța necesară.',
   'Nu confunda impulsul forței cu impulsul (cantitatea de mișcare). Primul e cauza, al doilea e efectul.',
   'intermediate'),

  -- Advanced concepts  
  ('30303030-3030-3030-3030-303030303030', 'Teorema energiei cinetice', 'formula',
   'Lucrul mecanic total efectuat de toate forțele care acționează asupra unui corp este egal cu variația energiei cinetice.',
   'L_total = ΔEc = Ec_f - Ec_i',
   'Dacă lucrul e pozitiv, corpul accelerează. Dacă e negativ, corpul încetinește.',
   'Teorema se aplică lucrului TOTAL al TUTUROR forțelor, nu doar unei singure forțe.',
   'advanced'),

  ('40404040-4040-4040-4040-404040404040', 'Conservarea energiei mecanice', 'formula',
   'În absența forțelor neconservative (frecare), suma energiei cinetice și potențiale rămâne constantă.',
   'Ec + Ep = constant',
   'E ca un pendul: energia se transformă continuu din cinetică în potențială și invers, dar totalul rămâne același.',
   'Conservarea se aplică doar când nu există forțe de frecare. În realitate, energia "se pierde" prin căldură.',
   'advanced'),

  ('50505050-5050-5050-5050-505050505050', 'Conservarea impulsului', 'formula',
   'Într-un sistem izolat (fără forțe externe), impulsul total se conservă.',
   'Σp_înainte = Σp_după',
   'De aceea o pușcă "trage înapoi" când tragi - impulsul total trebuie să rămână zero.',
   'Sistemul trebuie să fie izolat. Forțele interne nu afectează impulsul total, doar cele externe.',
   'advanced');

-- Insert edges (bidirectional relationships)
INSERT INTO knowledge_edges (source_node_id, target_node_id) VALUES
  -- Legea II Newton conectează Forță, Masă, Accelerație
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333'),
  
  -- Greutatea conectează Masă și Forță
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111'),
  
  -- Energia cinetică conectează Masă și Viteză
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222'),
  ('66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777'),
  
  -- Accelerația conectează Viteză și Timp
  ('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  
  -- Viteza conectează Deplasare/Distanță și Timp
  ('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  
  -- Viteza medie
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '77777777-7777-7777-7777-777777777777'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  
  -- Accelerația medie
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '77777777-7777-7777-7777-777777777777'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  
  -- Energia potențială gravitațională
  ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222'),
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555'),
  
  -- Lucru mecanic
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '66666666-6666-6666-6666-666666666666'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '88888888-8888-8888-8888-888888888888'),
  
  -- Putere
  ('99999999-9999-9999-9999-999999999999', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777'),
  
  -- Impuls (cantitatea de mișcare)
  ('10101010-1010-1010-1010-101010101010', '22222222-2222-2222-2222-222222222222'),
  ('10101010-1010-1010-1010-101010101010', '77777777-7777-7777-7777-777777777777'),
  
  -- Impulsul forței
  ('20202020-2020-2020-2020-202020202020', '11111111-1111-1111-1111-111111111111'),
  ('20202020-2020-2020-2020-202020202020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('20202020-2020-2020-2020-202020202020', '10101010-1010-1010-1010-101010101010'),
  
  -- Teorema energiei cinetice
  ('30303030-3030-3030-3030-303030303030', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  ('30303030-3030-3030-3030-303030303030', '66666666-6666-6666-6666-666666666666'),
  
  -- Conservarea energiei mecanice
  ('40404040-4040-4040-4040-404040404040', '66666666-6666-6666-6666-666666666666'),
  ('40404040-4040-4040-4040-404040404040', '88888888-8888-8888-8888-888888888888'),
  ('40404040-4040-4040-4040-404040404040', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  
  -- Conservarea impulsului
  ('50505050-5050-5050-5050-505050505050', '10101010-1010-1010-1010-101010101010'),
  ('50505050-5050-5050-5050-505050505050', '20202020-2020-2020-2020-202020202020');
