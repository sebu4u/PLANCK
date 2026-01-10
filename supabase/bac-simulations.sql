-- =====================================================
-- BAC SIMULATIONS SYSTEM
-- Schema pentru stocarea subiectelor de bacalaureat
-- =====================================================

-- Tabel pentru subiectele de simulare BAC
CREATE TABLE IF NOT EXISTS bac_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,           -- Anul subiectului (ex: 2024)
  name TEXT NOT NULL,              -- Numele subiectului (ex: "Subiect 1 - Mecanică")
  pdf_url TEXT NOT NULL,           -- URL-ul PDF-ului din Supabase Storage
  order_index INTEGER DEFAULT 0,   -- Pentru ordonare în sidebar
  is_active BOOLEAN DEFAULT true,  -- Pentru activare/dezactivare
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pentru căutare rapidă pe an
CREATE INDEX IF NOT EXISTS idx_bac_subjects_year ON bac_subjects(year);
CREATE INDEX IF NOT EXISTS idx_bac_subjects_active ON bac_subjects(is_active);

-- RLS policies
ALTER TABLE bac_subjects ENABLE ROW LEVEL SECURITY;

-- Toți utilizatorii pot citi subiectele active
DROP POLICY IF EXISTS "bac_subjects_read" ON bac_subjects;
CREATE POLICY "bac_subjects_read" ON bac_subjects
  FOR SELECT USING (is_active = true);

-- Trigger pentru updated_at
CREATE OR REPLACE FUNCTION update_bac_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bac_subjects_updated_at ON bac_subjects;
CREATE TRIGGER bac_subjects_updated_at
  BEFORE UPDATE ON bac_subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_bac_subjects_updated_at();

-- =====================================================
-- SAMPLE DATA (pentru testare - poți șterge după)
-- =====================================================
-- INSERT INTO bac_subjects (year, name, pdf_url, order_index) VALUES
--   (2024, 'Model Subiect - Mecanică', 'https://example.com/bac-2024-model.pdf', 1),
--   (2024, 'Varianta 1 - Termodinamică', 'https://example.com/bac-2024-v1.pdf', 2),
--   (2023, 'Model Subiect', 'https://example.com/bac-2023-model.pdf', 1),
--   (2023, 'Varianta 1', 'https://example.com/bac-2023-v1.pdf', 2);
