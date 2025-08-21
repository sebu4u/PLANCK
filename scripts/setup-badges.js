const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurare Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabilele de mediu NEXT_PUBLIC_SUPABASE_URL și SUPABASE_SERVICE_ROLE_KEY sunt necesare');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBadges() {
  try {
    console.log('🚀 Configurare sistem de badge-uri...');
    
    // Citește fișierul SQL
    const sqlPath = path.join(__dirname, '../supabase/badges-system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execută migrația
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Eroare la executarea migrației:', error);
      return;
    }
    
    console.log('✅ Sistemul de badge-uri a fost configurat cu succes!');
    console.log('📋 Badge-urile disponibile:');
    console.log('   🌱 Începător (1 problemă)');
    console.log('   🔬 Novice Fizician (5 probleme)');
    console.log('   📚 Apprentice (10 probleme)');
    console.log('   💪 Problema Buster (25 probleme)');
    console.log('   🔍 Cercetător Junior (50 probleme)');
    console.log('   🧪 Experimentator (100 probleme)');
    console.log('   👑 Maestru al problemelor (200 probleme)');
    console.log('   ⚡ Fizician Expert (300 probleme)');
    console.log('   🔬 Omul de știință (400 probleme)');
    console.log('   🌟 Legendă PLANCK (500 probleme)');
    
  } catch (error) {
    console.error('❌ Eroare:', error);
  }
}

// Alternativ, dacă nu există funcția exec_sql, poți rula manual în Supabase SQL Editor
async function manualSetup() {
  console.log('📝 Pentru a configura manual sistemul de badge-uri:');
  console.log('1. Mergi la Supabase Dashboard');
  console.log('2. Deschide SQL Editor');
  console.log('3. Copiază și rulează conținutul din supabase/badges-system.sql');
  console.log('4. Salvează și rulează query-ul');
}

if (require.main === module) {
  setupBadges().catch(console.error);
}

module.exports = { setupBadges, manualSetup };
