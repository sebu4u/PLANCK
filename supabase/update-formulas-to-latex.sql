-- Update existing formulas to use LaTeX syntax instead of Unicode symbols
-- Run this script to fix LaTeX rendering on /space page

-- Update all knowledge_nodes formulas to use proper LaTeX syntax
UPDATE knowledge_nodes SET formula = E'F = m \\cdot a' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE knowledge_nodes SET formula = E'G = m \\cdot g' WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE knowledge_nodes SET formula = E'v = \\frac{d}{t}' WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
UPDATE knowledge_nodes SET formula = E'a = \\frac{\\Delta v}{\\Delta t}' WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
UPDATE knowledge_nodes SET formula = E'E_c = \\frac{1}{2} m v^2' WHERE id = '66666666-6666-6666-6666-666666666666';
UPDATE knowledge_nodes SET formula = E'E_p = m \\cdot g \\cdot h' WHERE id = '88888888-8888-8888-8888-888888888888';
UPDATE knowledge_nodes SET formula = E'L = F \\cdot d \\cdot \\cos(\\alpha)' WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
UPDATE knowledge_nodes SET formula = E'P = \\frac{L}{t} \\quad \\text{sau} \\quad P = F \\cdot v' WHERE id = '99999999-9999-9999-9999-999999999999';
UPDATE knowledge_nodes SET formula = E'I = F \\cdot \\Delta t = \\Delta p' WHERE id = '20202020-2020-2020-2020-202020202020';
UPDATE knowledge_nodes SET formula = E'L_{total} = \\Delta E_c = E_{c,f} - E_{c,i}' WHERE id = '30303030-3030-3030-3030-303030303030';
UPDATE knowledge_nodes SET formula = E'E_c + E_p = const' WHERE id = '40404040-4040-4040-4040-404040404040';
UPDATE knowledge_nodes SET formula = E'\\sum p_{inainte} = \\sum p_{dupa}' WHERE id = '50505050-5050-5050-5050-505050505050';
