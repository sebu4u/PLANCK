-- Fix and Expand Electricity Concepts
-- 1. Restores the original electricity nodes (d/e/f series) if they were overwritten
-- 2. Adds NEW electricity concepts (8 series) for advanced circuits

-- RESTORATION OF ORIGINAL ELECTRICITY NODES IS CRITICAL
-- We use ON CONFLICT DO UPDATE to ensure these specific IDs hold Electricity data
INSERT INTO knowledge_nodes (id, title, type, explanation, formula, intuition, common_mistake, difficulty) VALUES
  -- Basic electricity concepts (Restoring d-series)
  ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Sarcină electrică', 'concept', 
   'Sarcina electrică este o proprietate fundamentală a materiei care determină interacțiunile electromagnetice. Există două tipuri: pozitivă și negativă.',
   NULL,
   'Gândește-te la sarcini ca la "magneți" - sarcinile opuse se atrag, cele de același fel se resping.',
   'Sarcina se conservă - nu poate fi creată sau distrusă, doar transferată de la un corp la altul.',
   'basic'),
   
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Curent electric', 'concept',
   'Curentul electric reprezintă mișcarea ordonată a purtătorilor de sarcină electrică (electroni sau ioni) printr-un conductor.',
   NULL,
   'Imaginează-ți apa care curge printr-un tub - curentul electric este similar, dar cu electroni în loc de molecule de apă.',
   'Curentul convențional are sens opus mișcării electronilor. Electronii se mișcă de la - la +, dar curentul se consideră de la + la -.',
   'basic'),

  ('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Tensiune electrică', 'concept',
   'Tensiunea electrică (diferența de potențial) reprezintă energia pe unitatea de sarcină necesară pentru a deplasa sarcina între două puncte.',
   NULL,
   'Tensiunea e ca diferența de înălțime pentru apă - cu cât e mai mare, cu atât "împinge" mai tare electronii.',
   'Tensiunea se măsoară ÎNTRE două puncte, nu într-un singur punct. Întotdeauna avem nevoie de o referință.',
   'basic'),

  ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Rezistență electrică', 'concept',
   'Rezistența electrică măsoară opoziția pe care un material o oferă trecerii curentului electric.',
   NULL,
   'E ca frecarea pentru curent - cu cât rezistența e mai mare, cu atât e mai greu să treacă curentul.',
   'Rezistența depinde de material, lungime și secțiune. Un fir lung și subțire are rezistență mare.',
   'basic'),

  ('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Conductor electric', 'concept',
   'Un conductor electric este un material care permite trecerea ușoară a curentului electric datorită electronilor liberi.',
   NULL,
   'Metalele sunt conductori buni pentru că au mulți electroni liberi care pot "curge" prin material.',
   'Chiar și conductorii buni au rezistență - nu există conductor perfect (cu excepția supraconductorilor).',
   'basic'),

  ('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Izolator electric', 'concept',
   'Un izolator electric este un material care nu permite trecerea curentului electric deoarece electronii sunt legați puternic de atomi.',
   NULL,
   'Plasticul, sticla, cauciucul sunt izolatori - de aceea cablurile electrice au înveliș de plastic.',
   'La tensiuni foarte mari, chiar și izolatorii pot deveni conductori (străpungere electrică).',
   'basic'),

  -- Basic electricity formulas (Restoring e-series)
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Legea lui Ohm', 'formula',
   'Legea fundamentală a circuitelor electrice: tensiunea este egală cu produsul dintre intensitatea curentului și rezistență.',
   E'U = I \\cdot R',
   'Cu cât rezistența e mai mare, cu atât ai nevoie de mai multă tensiune pentru același curent.',
   'Legea lui Ohm e valabilă doar pentru rezistori ohmici (liniari). Diodele și tranzistorii nu o respectă.',
   'basic'),

  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Intensitatea curentului', 'formula',
   'Intensitatea curentului electric este cantitatea de sarcină care trece printr-o secțiune a conductorului în unitatea de timp.',
   E'I = \\frac{Q}{t}',
   'Un Amper înseamnă un Coulomb de sarcină care trece în fiecare secundă.',
   'Intensitatea e aceeași în toate punctele unui circuit serie - nu "se consumă" pe parcurs.',
   'basic'),

  ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'Puterea electrică', 'formula',
   'Puterea electrică reprezintă energia transferată sau consumată în unitatea de timp într-un circuit.',
   E'P = U \\cdot I = I^2 R = \\frac{U^2}{R}',
   'Un bec de 100W consumă de 10 ori mai multă energie pe secundă decât unul de 10W.',
   'Puterea pierdută pe rezistență crește cu pătratul curentului - de aceea liniile de înaltă tensiune folosesc tensiune mare și curent mic.',
   'basic'),

  ('e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', 'Energia electrică', 'formula',
   'Energia electrică consumată este produsul dintre putere și timp.',
   E'W = P \\cdot t = U \\cdot I \\cdot t',
   'Factura de curent măsoară energia în kWh - kilowați (putere) × ore (timp).',
   'kWh nu e putere, e energie! 1 kWh = 3.6 MJ.',
   'basic'),

  ('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'Rezistența conductorului', 'formula',
   'Rezistența unui conductor depinde de materialul, lungimea și aria secțiunii transversale.',
   E'R = \\rho \\cdot \\frac{l}{S}',
   'Un fir lung și subțire are rezistență mare. Un fir scurt și gros are rezistență mică.',
   'ρ (rezistivitatea) depinde de material ȘI de temperatură - crește când conductorul se încălzește.',
   'intermediate'),

  -- Intermediate electricity formulas (Restoring e-series continued)
  ('e6e6e6e6-e6e6-e6e6-e6e6-e6e6e6e6e6e6', 'Rezistori în serie', 'formula',
   'Rezistența echivalentă a rezistorilor legați în serie este suma rezistențelor individuale.',
   E'R_{eq} = R_1 + R_2 + R_3 + ...',
   'În serie, rezistențele se adună - fiecare rezistor "blochează" puțin mai mult curentul.',
   'În serie, curentul e același peste tot, dar tensiunile se împart proporțional cu rezistențele.',
   'intermediate'),

  ('e7e7e7e7-e7e7-e7e7-e7e7-e7e7e7e7e7e7', 'Rezistori în paralel', 'formula',
   'Inversul rezistenței echivalente în paralel este suma inverselor rezistențelor individuale.',
   E'\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3} + ...',
   'În paralel, curentul se "împarte" pe mai multe căi - rezistența totală scade.',
   'Rezistența echivalentă în paralel e MEREU mai mică decât cea mai mică rezistență din grup.',
   'intermediate'),

  ('e8e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e8', 'Legea lui Kirchhoff I (noduri)', 'formula',
   'Suma curenților care intră într-un nod este egală cu suma curenților care ies din acel nod.',
   E'\\sum I_{in} = \\sum I_{out}',
   'Electronii nu se pot "acumula" în nod - tot ce intră trebuie să și iasă.',
   'Se aplică doar nodurilor (puncte unde se întâlnesc mai mult de 2 conductori).',
   'intermediate'),

  ('e9e9e9e9-e9e9-e9e9-e9e9-e9e9e9e9e9e9', 'Legea lui Kirchhoff II (ochiuri)', 'formula',
   'Suma algebrică a tensiunilor de-a lungul oricărui circuit închis (ochi) este zero.',
   E'\\sum U = 0',
   'Ce "urci" în tensiune trebuie să "cobori" înapoi când faci o buclă completă.',
   'Trebuie să alegi un sens de parcurgere și să respecți semnele (+ când urci în tensiune, - când cobori).',
   'intermediate'),

  -- Electrostatics (Restoring f-series)
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'Legea lui Coulomb', 'formula',
   'Forța de interacțiune între două sarcini punctiforme este direct proporțională cu produsul sarcinilor și invers proporțională cu pătratul distanței.',
   E'F = k \\cdot \\frac{|q_1 \\cdot q_2|}{r^2}',
   'Similar cu gravitația, dar poate fi și repulsivă. Și scade foarte repede cu distanța (cu pătratul!).',
   'k = 9×10⁹ N·m²/C². Forța e pe direcția care unește sarcinile, atractivă sau repulsivă.',
   'intermediate'),

  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'Câmpul electric', 'formula',
   'Câmpul electric reprezintă forța pe unitatea de sarcină într-un punct din spațiu.',
   E'E = \\frac{F}{q} = k \\cdot \\frac{Q}{r^2}',
   'Câmpul electric e ca "influența" pe care o sarcină o exercită în jurul ei.',
   'Câmpul e definit pentru o sarcină de probă pozitivă. Direcția: de la + spre -.',
   'intermediate'),

  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'Potențialul electric', 'formula',
   'Potențialul electric într-un punct este energia potențială electrică pe unitatea de sarcină.',
   E'V = k \\cdot \\frac{Q}{r}',
   'Potențialul scade mai lent cu distanța decât câmpul (cu r, nu cu r²).',
   'Potențialul e scalar, nu vector. Poate fi pozitiv sau negativ.',
   'intermediate'),

  ('f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4', 'Capacitatea electrică', 'formula',
   'Capacitatea unui condensator reprezintă raportul dintre sarcina stocată și tensiunea aplicată.',
   E'C = \\frac{Q}{U}',
   'Cu cât capacitatea e mai mare, cu atât condensatorul poate stoca mai multă sarcină la aceeași tensiune.',
   'Capacitatea depinde DOAR de geometrie și materialul dielectric, nu de sarcina sau tensiunea aplicată.',
   'intermediate'),

  ('f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5', 'Capacitatea condensatorului plan', 'formula',
   'Capacitatea unui condensator plan depinde de aria plăcilor, distanța dintre ele și materialul dielectric.',
   E'C = \\varepsilon_0 \\varepsilon_r \\cdot \\frac{S}{d}',
   'Plăci mari și apropiate = capacitate mare. Dielectric bun crește și el capacitatea.',
   'ε₀ = 8.85×10⁻¹² F/m (permitivitatea vidului). εᵣ e permitivitatea relativă a dielectricului.',
   'advanced'),

  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'Energia condensatorului', 'formula',
   'Energia stocată într-un condensator încărcat.',
   E'W = \\frac{1}{2} C U^2 = \\frac{Q^2}{2C} = \\frac{1}{2} Q U',
   'Condensatorul stochează energie în câmpul electric dintre plăci.',
   'Energia crește cu pătratul tensiunii - dublarea tensiunii înseamnă de 4 ori mai multă energie.',
   'advanced'),

  -- Advanced concepts (Restoring f-series continued)
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f7', 'Forța electromotrică (FEM)', 'formula',
   'Forța electromotrică este energia pe unitatea de sarcină furnizată de o sursă de tensiune.',
   E'\\mathcal{E} = \\frac{W}{Q}',
   'FEM e "pompa" care împinge electronii prin circuit. E tensiunea la bornele sursei când nu curge curent.',
   'FEM include și tensiunea pierdută pe rezistența internă a sursei.',
   'advanced'),

  ('f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8', 'Legea lui Ohm generalizată', 'formula',
   'Legea lui Ohm pentru un circuit complet care include rezistența internă a sursei.',
   E'I = \\frac{\\mathcal{E}}{R + r}',
   'Când conectezi un consumator, curentul depinde și de rezistența internă a sursei.',
   'La scurtcircuit (R→0), curentul maxim este limitat de rezistența internă: I_max = ε/r.',
   'advanced')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  explanation = EXCLUDED.explanation,
  formula = EXCLUDED.formula,
  intuition = EXCLUDED.intuition,
  common_mistake = EXCLUDED.common_mistake,
  difficulty = EXCLUDED.difficulty;


-- ADDITION OF NEW ELECTRICITY NODES (8 series)
INSERT INTO knowledge_nodes (id, title, type, explanation, formula, intuition, common_mistake, difficulty) VALUES
  ('81818181-8181-8181-8181-818181818181', 'Gruparea generatoarelor', 'formula',
   'Surselor electrice pot fi grupate în serie (pentru tensiune mai mare) sau în paralel (pentru curent mai mare).',
   E'Serie: \\mathcal{E}_{ech} = \\sum \\mathcal{E}_i, r_{ech} = \\sum r_i \\\\ Paralel: \\frac{1}{r_{ech}} = \\sum \\frac{1}{r_i}, \\frac{\\mathcal{E}_{ech}}{r_{ech}} = \\sum \\frac{\\mathcal{E}_i}{r_i}',
   'Bateriile telecomandei sunt în serie (3V total din 2x1.5V). Bateria mașinii are celule în serie.',
   'NU conecta în paralel surse cu tensiuni diferite - vor "lupta" între ele și se vor supraîncălzi.',
   'advanced'),

  ('82828282-8282-8282-8282-828282828282', 'Divizorul de tensiune', 'formula',
   'Într-un circuit serie, tensiunea se împarte proporțional cu rezistența. Folosit pentru a obține o tensiune mai mică.',
   E'U_1 = U \\cdot \\frac{R_1}{R_1 + R_2}',
   'Rezistivitatea mai mare "atrage" mai multă tensiune asupra ei.',
   'Formula e valabilă doar dacă divizorul nu e "încărcat" (nu tragi curent din punctul intermediar).',
   'intermediate'),

  ('83838383-8383-8383-8383-838383838383', 'Divizorul de curent', 'formula',
   'Într-un circuit paralel, curentul se împarte invers proporțional cu rezistența.',
   E'I_1 = I \\cdot \\frac{R_2}{R_1 + R_2}',
   'Curentul preferă calea cu rezistență minimă ("path of least resistance").',
   'Dacă R1 e mult mai mic decât R2, aproape tot curentul va trece prin R1.',
   'intermediate'),

  ('84848484-8484-8484-8484-848484848484', 'Teorema transferului maxim de putere', 'formula',
   'Puterea transferată de o sursă unui consumator este maximă când rezistența consumatorului este egală cu rezistența internă a sursei.',
   E'P_{max} \\iff R = r',
   'Adaptarea de impedanță (matching) este critică în telecomunicații și audio.',
   'Deși puterea transferată e maximă, randamentul este doar 50% (jumătate din energie se pierde în sursă).',
   'advanced'),

  ('85858585-8585-8585-8585-858585858585', 'Puntea Wheatstone', 'formula',
   'Un circuit folosit pentru a măsura o rezistență necunoscută prin echilibrarea a două ramuri.',
   E'R_x = R_3 \\cdot \\frac{R_2}{R_1} \\text{ (la echilibru)}',
   'Când puntea e echilibrată, galvanometrul de pe diagonală indică zero curent.',
   'Este cea mai precisă metodă de a măsura rezistențe.',
   'advanced'),

  ('86868686-8686-8686-8686-868686868686', 'Scurtcircuit', 'concept',
   'Conexiune electrică accidentală sau intenționată între două puncte cu potețial diferit, având rezistență foarte mică (aproape zero).',
   NULL,
   'Curentul devine enorm (limitat doar de sursă), generând căldură intensă și risc de incendiu.',
   'Siguranța "sare" tocmai pentru a proteja instalația de efectele unui scurtcircuit.',
   'basic'),

  ('87878787-8787-8787-8787-878787878787', 'Ampermetru și Voltmetru', 'concept',
   'Ampermetrul măsoară curentul (se leagă în SERIE). Voltmetrul măsoară tensiunea (se leagă în PARALEL).',
   NULL,
   'Ampermetrul ideal are rezistență zero. Voltmetrul ideal are rezistență infinită.',
   'Dacă legi ampermetrul în paralel, faci scurtcircuit! Dacă legi voltmetrul în serie, întrerupi circuitul.',
   'basic'),

  ('88888888-8888-8888-8888-888888888888', 'Efectul Joule', 'formula',
   'Degajarea de căldură la trecerea curentului electric printr-un conductor.',
   E'Q = I^2 \\cdot R \\cdot t',
   'Așa funcționează reșoul, fierul de călcat și becul cu incandescență.',
   'Este adesea un efect nedorit ("pierderi prin efect Joule") în calculatoare sau transportul energiei.',
   'basic'),

  ('89898989-8989-8989-8989-898989898989', 'Rezistivitatea și temperatura', 'formula',
   'Rezistivitatea metalelor crește odată cu temperatura.',
   E'\\rho = \\rho_0 (1 + \\alpha \\Delta t)',
   'Filamentul (rece) al unui bec are rezistență mult mai mică decât atunci când e aprins (cald).',
   'Termistorii sunt componente fabricate special pentru a varia mult rezistența cu temperatura.',
   'intermediate')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  explanation = EXCLUDED.explanation,
  formula = EXCLUDED.formula,
  intuition = EXCLUDED.intuition,
  common_mistake = EXCLUDED.common_mistake,
  difficulty = EXCLUDED.difficulty;

-- Insert edges connecting NEW electricity concepts (edges connected to overwritten nodes too)
INSERT INTO knowledge_edges (source_node_id, target_node_id) VALUES
  -- Restoring critical links for overwritten nodes
  -- Sarcina electrică conectată cu curent și forță Coulomb
  ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2'),
  ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1'),
  
  -- ... (I'll trust the previous script inserted edges but edges might be lost if I deleted/overwrote nodes? No, overwrite doesn't delete edges if IDs match. However, edges are ON CONFLICT DO NOTHING, so they should be fine.)
  
  -- NEW EDGES for 8 series
  -- Gruparea generatoarelor legata de FEM si Rezistenta interna (f7, f8, r not explicit node but concept)
  ('81818181-8181-8181-8181-818181818181', 'f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f7'), -- Cu FEM
  ('81818181-8181-8181-8181-818181818181', 'f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8'), -- Cu Ohm generalizat
  
  -- Divizor de tensiune legat de tensiune si rezistenta
  ('82828282-8282-8282-8282-828282828282', 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3'),
  ('82828282-8282-8282-8282-828282828282', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4'),
  ('82828282-8282-8282-8282-828282828282', 'e6e6e6e6-e6e6-e6e6-e6e6-e6e6e6e6e6e6'), -- Rezistori in serie

  -- Divizor de curent legat de curent si rezistenta
  ('83838383-8383-8383-8383-838383838383', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2'),
  ('83838383-8383-8383-8383-838383838383', 'e7e7e7e7-e7e7-e7e7-e7e7-e7e7e7e7e7e7'), -- Rezistori in paralel

  -- Teorema transferului maxim legata de Putere si FEM
  ('84848484-8484-8484-8484-848484848484', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3'), -- Putere
  ('84848484-8484-8484-8484-848484848484', 'f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f7'), -- FEM

  -- Puntea Wheatstone legata de Rezistenta
  ('85858585-8585-8585-8585-858585858585', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4'),
  
  -- Scurtcircuit legat de curent si rezistenta
  ('86868686-8686-8686-8686-868686868686', 'f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8'), -- Ohm Gen (I_max)

  -- Amp/Volt related to concepts
  ('87878787-8787-8787-8787-878787878787', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2'), -- Curent
  ('87878787-8787-8787-8787-878787878787', 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3'), -- Tensiune
  
  -- Efect Joule cu Putere/Energie/Caldura(Thermo?)
  ('88888888-8888-8888-8888-888888888888', 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4'), -- Energie electrica
  ('88888888-8888-8888-8888-888888888888', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3'), -- Putere

  -- Rezistivitate cu Rezistenta conductorului
  ('89898989-8989-8989-8989-898989898989', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5')

ON CONFLICT (source_node_id, target_node_id) DO NOTHING;
